from __future__ import annotations
import os, json, time, hashlib, platform
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

SEED=20260811
RNG=np.random.default_rng(SEED)
OUT=Path('hubert_pretrained_results')
for s in ['results','figures']:(OUT/s).mkdir(parents=True,exist_ok=True)

controls=['global_pitch','pitch_chirp','timing_warp','loudness','source_tilt','tract_F1','nuisance_tone','nuisance_noise']
d=len(controls); sr=16000; N=4800
KT=np.eye(d)[:,6:8]
JT=np.zeros((6,d)); JT[:,:6]=np.eye(6)
primary_tau=1e-5
tau_grid=np.array([1e-7,3e-7,1e-6,3e-6,1e-5,3e-5,1e-4,3e-4,1e-3])
delta_grid=np.array([0.02,0.05,0.10])
n_baselines=6

def orth(A,tol=1e-12):
    A=np.asarray(A,float)
    if A.size==0:return np.zeros((A.shape[0],0))
    u,s,_=np.linalg.svd(A,full_matrices=False)
    if not len(s):return np.zeros((A.shape[0],0))
    r=int(np.sum(s>tol*max(1.0,s[0])))
    return u[:,:r]

def projector(B):
    Q=orth(B); return Q@Q.T if Q.shape[1] else np.zeros((B.shape[0],B.shape[0]))

def spectrum_kernel(J,tau):
    G=np.asarray(J,float).T@np.asarray(J,float)
    w,V=np.linalg.eigh((G+G.T)/2)
    idx=np.argsort(w)[::-1]; w=np.clip(w[idx],0,None); V=V[:,idx]
    s=np.sqrt(w); smax=s[0] if len(s) else 0.0
    rank=int(np.sum(s>tau*max(smax,1e-30)))
    return V[:,rank:].copy(),s,rank,V[:,:rank]

def task_metrics(F):
    PF,PK=projector(F),projector(KT)
    dF=int(round(np.trace(PF))); omega=float(np.trace(PF@PK))
    return dict(dim_F=dF,omega=omega,nu=float(2-omega),alpha=float(dF-omega),mu=float(np.linalg.norm(PF-PK,'fro')**2))

def fac_residual(Vrank):
    P=Vrank@Vrank.T if Vrank.shape[1] else np.zeros((d,d))
    return float(np.linalg.norm(JT@(np.eye(d)-P),'fro')/(np.linalg.norm(JT,'fro')+1e-15))

def nesting(Fa,Fb):
    Pa,Pb=projector(Fa),projector(Fb)
    return float(np.linalg.norm((np.eye(d)-Pb)@Pa,'fro'))

t=np.arange(N)/sr
noise_shape=RNG.normal(size=N)
noise_shape=np.convolve(noise_shape,np.ones(31)/31,mode='same')
noise_shape/=np.std(noise_shape)+1e-12
baselines=np.zeros((n_baselines,d))
baselines[:,:6]=RNG.uniform(-0.35,0.35,size=(n_baselines,6))

def synth(theta):
    theta=np.asarray(theta,float)
    f0=190*np.exp(0.22*theta[0]); chirp=0.18*theta[1]
    tw=t+0.0015*theta[2]*np.sin(2*np.pi*3*t)
    inst=f0*(1+chirp*(tw/tw[-1]-0.5))
    phase=2*np.pi*np.cumsum(inst)/sr+0.28*theta[2]*np.sin(2*np.pi*3*t)
    tilt=1.0+0.35*theta[4]; F1=700+120*theta[5]
    y=np.zeros(N)
    for k in range(1,13):
        fk=k*f0
        env=(0.3+np.exp(-0.5*((fk-F1)/180)**2)+0.5*np.exp(-0.5*((fk-1200)/260)**2))
        y+=env/(k**tilt)*np.sin(k*phase)
    amp=0.13*np.exp(0.35*theta[3]); envelope=np.sin(np.pi*np.clip(t/t[-1],0,1))**0.7
    y=amp*envelope*y/(np.max(np.abs(y))+1e-12)
    y+=0.025*theta[6]*np.sin(2*np.pi*2873*t)
    y+=0.018*theta[7]*noise_shape
    return np.clip(y,-0.95,0.95).astype(np.float32)

waves=[]; pair_index={}; manifest=[]
for b in range(n_baselines):
  for di,delta in enumerate(delta_grid):
    for a in range(d):
      ids=[]
      for sign in [+1,-1]:
        th=baselines[b].copy(); th[a]+=sign*delta
        ids.append(len(waves)); waves.append(synth(th))
        manifest.append(dict(baseline=b,delta=float(delta),control=a,control_name=controls[a],sign=sign))
      pair_index[(b,di,a)]=tuple(ids)
X_np=np.stack(waves)
pd.DataFrame(manifest).to_csv(OUT/'results/intervention_manifest.csv',index=False)
pd.DataFrame(baselines,columns=controls).to_csv(OUT/'results/baseline_states.csv',index_label='baseline')

rand_proj=[]
for _ in range(4000):
    Q,_=np.linalg.qr(RNG.normal(size=(d,2))); rand_proj.append(Q@Q.T)
rand_proj=np.stack(rand_proj)

def random_null(F,actual_mu):
    PF=projector(F); dF=int(round(np.trace(PF)))
    overlaps=np.einsum('ij,nji->n',PF,rand_proj); mus=dF+2-2*overlaps
    return dict(random_mu_mean=float(mus.mean()),random_mu_q05=float(np.quantile(mus,.05)),random_mu_q50=float(np.quantile(mus,.5)),random_mu_q95=float(np.quantile(mus,.95)),random_mu_p_le_actual=float((np.sum(mus<=actual_mu)+1)/(len(mus)+1)))

import torch, torchaudio
torch.set_num_threads(max(1,min(4,os.cpu_count() or 1)))
torch.manual_seed(SEED)
bundle=torchaudio.pipelines.HUBERT_BASE
model=bundle.get_model().eval()
ckpt=Path(torch.hub.get_dir())/'checkpoints'/'hubert_fairseq_base_ls960.pth'
sha256=None
if ckpt.exists():
    h=hashlib.sha256()
    with ckpt.open('rb') as f:
        for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
    sha256=h.hexdigest()

X=torch.tensor(X_np,dtype=torch.float32)
def extract_all_cuts(X,batch_size=24):
    names=['waveform','conv_feature_sequence','encoder_projection_sequence']+[f'transformer_{i}' for i in range(1,13)]
    stores=[[] for _ in names]
    with torch.inference_mode():
      for start in range(0,len(X),batch_size):
        xb=X[start:start+batch_size]
        conv,_=model.feature_extractor(xb,None)
        proj=model.encoder.feature_projection(conv)
        layers=model.encoder.extract_features(conv,None)
        vals=[xb,conv,proj]+list(layers)
        for k,z in enumerate(vals):stores[k].append(z.detach().cpu().reshape(z.shape[0],-1).numpy())
    return [np.concatenate(v,axis=0) for v in stores],names

started=time.time(); cuts,names=extract_all_cuts(X); inference_seconds=time.time()-started
rows=[]; srows=[]; trows=[]; nrows=[]; kernels={}
for b in range(n_baselines):
  for di,delta in enumerate(delta_grid):
    for ell,(Z,name) in enumerate(zip(cuts,names)):
      cols=[]
      for a in range(d):
        ip,im=pair_index[(b,di,a)]; cols.append((Z[ip]-Z[im])/(2*delta))
      J=np.stack(cols,axis=1).astype(np.float64)
      F,s,rank,Vrank=spectrum_kernel(J,primary_tau); kernels[(b,di,ell)]=F
      tm=task_metrics(F); rn=random_null(F,tm['mu'])
      rows.append(dict(baseline=b,delta=float(delta),cut=ell,cut_name=name,tau_rel=primary_tau,rank_J=rank,sigma_min_over_max=float(s[-1]/s[0]) if s[0]>0 else np.nan,factorization_residual=fac_residual(Vrank),**tm,**rn))
      for j,sv in enumerate(s):srows.append(dict(baseline=b,delta=float(delta),cut=ell,cut_name=name,singular_index=j,singular_value=float(sv),relative_singular_value=float(sv/s[0]) if s[0]>0 else np.nan))
      for tau in tau_grid:
        Ft,st,rt,Vrt=spectrum_kernel(J,float(tau)); tt=task_metrics(Ft)
        trows.append(dict(baseline=b,delta=float(delta),cut=ell,cut_name=name,tau_rel=float(tau),rank_J=rt,factorization_residual=fac_residual(Vrt),**tt))
for b in range(n_baselines):
  for di,delta in enumerate(delta_grid):
    for ell in range(len(names)-1):
      nrows.append(dict(baseline=b,delta=float(delta),cut_from=ell,cut_to=ell+1,cut_from_name=names[ell],cut_to_name=names[ell+1],epsilon_nest=nesting(kernels[(b,di,ell)],kernels[(b,di,ell+1)])))

df=pd.DataFrame(rows); sv=pd.DataFrame(srows); th=pd.DataFrame(trows); nd=pd.DataFrame(nrows)
df.to_csv(OUT/'results/per_state_primary_metrics.csv',index=False); sv.to_csv(OUT/'results/singular_spectra.csv',index=False); th.to_csv(OUT/'results/threshold_sweep.csv',index=False); nd.to_csv(OUT/'results/nesting_residuals.csv',index=False)
agg=df.groupby(['cut','cut_name']).agg(n=('nu','size'),nu_median=('nu','median'),nu_q10=('nu',lambda x:np.quantile(x,.1)),nu_q90=('nu',lambda x:np.quantile(x,.9)),alpha_median=('alpha','median'),alpha_q10=('alpha',lambda x:np.quantile(x,.1)),alpha_q90=('alpha',lambda x:np.quantile(x,.9)),mu_median=('mu','median'),fac_median=('factorization_residual','median'),rank_median=('rank_J','median'),sigma_minmax_median=('sigma_min_over_max','median'),random_mu_q05_median=('random_mu_q05','median'),random_mu_q50_median=('random_mu_q50','median'),random_p_median=('random_mu_p_le_actual','median')).reset_index()
agg.to_csv(OUT/'results/depth_summary.csv',index=False)
na=nd.groupby(['cut_to','cut_to_name']).agg(epsilon_nest_median=('epsilon_nest','median'),epsilon_nest_q95=('epsilon_nest',lambda x:np.quantile(x,.95))).reset_index(); na.to_csv(OUT/'results/nesting_summary.csv',index=False)
thagg=th.groupby(['cut','cut_name','tau_rel']).agg(nu_median=('nu','median'),alpha_median=('alpha','median'),mu_median=('mu','median'),fac_median=('factorization_residual','median'),rank_median=('rank_J','median')).reset_index(); thagg.to_csv(OUT/'results/threshold_depth_summary.csv',index=False)

safe=agg[(agg.alpha_median<=0.2)&(agg.fac_median<=0.1)]
if len(safe):
    star=safe.loc[safe.nu_median.idxmin()]; best=dict(has_safe_cut=True,cut=int(star.cut),cut_name=str(star.cut_name),nu=float(star.nu_median),alpha=float(star.alpha_median),fac=float(star.fac_median),mu=float(star.mu_median))
else:best=dict(has_safe_cut=False)
nu0=float(agg.iloc[0].nu_median); min_nu=float(agg.nu_median.min()); minpos=int(agg.nu_median.idxmin()); max_alpha_before_min=float(agg.loc[:minpos,'alpha_median'].max())
H1_support=bool(min_nu < nu0-0.25 and max_alpha_before_min<=0.2)
H2_support=bool(len(safe) and float(safe.mu_median.min())<=0.25)
H3_random_task_support=bool((agg.random_p_median<0.05).any())

plt.figure(figsize=(8,4.8)); plt.plot(agg.cut,agg.nu_median,marker='o',label='nu'); plt.fill_between(agg.cut,agg.nu_q10,agg.nu_q90,alpha=.15); plt.plot(agg.cut,agg.alpha_median,marker='o',label='alpha'); plt.fill_between(agg.cut,agg.alpha_q10,agg.alpha_q90,alpha=.15); plt.xlabel('complete cut'); plt.ylabel('soft dimension'); plt.title('Pretrained HuBERT task-kernel alignment'); plt.legend(); plt.tight_layout(); plt.savefig(OUT/'figures/pretrained_nu_alpha.png',dpi=180); plt.close()
plt.figure(figsize=(8,4.8)); plt.plot(agg.cut,agg.mu_median,marker='o',label='declared task kernel'); plt.plot(agg.cut,agg.random_mu_q50_median,marker='o',label='random 2D task kernel median'); plt.plot(agg.cut,agg.random_mu_q05_median,linestyle='--',label='random 5% quantile'); plt.xlabel('complete cut'); plt.ylabel('kernel mismatch mu'); plt.title('Declared task kernel vs random-task null'); plt.legend(); plt.tight_layout(); plt.savefig(OUT/'figures/pretrained_mu_vs_random_task.png',dpi=180); plt.close()
plt.figure(figsize=(8,4.8)); plt.plot(agg.cut,agg.fac_median,marker='o'); plt.xlabel('complete cut'); plt.ylabel('factorization residual'); plt.title('Pretrained HuBERT task-factorization residual'); plt.tight_layout(); plt.savefig(OUT/'figures/pretrained_factorization.png',dpi=180); plt.close()
plt.figure(figsize=(8,4.8)); plt.semilogy(agg.cut,np.maximum(agg.sigma_minmax_median,1e-12),marker='o'); plt.axhline(primary_tau,linestyle='--'); plt.xlabel('complete cut'); plt.ylabel('median sigma_min / sigma_max'); plt.title('Smallest controlled singular direction'); plt.tight_layout(); plt.savefig(OUT/'figures/pretrained_smallest_singular_ratio.png',dpi=180); plt.close()
plt.figure(figsize=(8,4.8)); plt.plot(na.cut_to,na.epsilon_nest_median,marker='o'); plt.xlabel('downstream complete cut'); plt.ylabel('median epsilon_nest'); plt.title('Numerical nesting audit'); plt.tight_layout(); plt.savefig(OUT/'figures/pretrained_nesting.png',dpi=180); plt.close()

info=dict(model='torchaudio.pipelines.HUBERT_BASE',sample_rate=bundle.sample_rate,checkpoint=str(ckpt),checkpoint_sha256=sha256,torch=torch.__version__,torchaudio=torchaudio.__version__,python=platform.python_version(),seed=SEED,n_waveforms=len(X_np),n_baselines=n_baselines,delta_grid=delta_grid.tolist(),tau_grid=tau_grid.tolist(),primary_tau=primary_tau,inference_seconds=inference_seconds,controls=controls,task_null_controls=controls[6:8],nuisance_tone_hz=2873)
(OUT/'results/model_info.json').write_text(json.dumps(info,indent=2))
summary=dict(H1_selective_task_null_compression=H1_support,H2_intermediate_task_aligned_bottleneck=H2_support,H3_random_task_component=H3_random_task_support,best_exploratory_safe_cut=best,initial_nu=nu0,min_nu=min_nu,max_alpha_through_min_nu=max_alpha_before_min,checkpoint_sha256=sha256)
(OUT/'results/summary.json').write_text(json.dumps(summary,indent=2))
report=f'''# Pretrained HuBERT Main Experiment\n\nThis is the missing pretrained arm of the task-aligned controlled-forgetting experiment. It uses the official `torchaudio.pipelines.HUBERT_BASE` checkpoint, the same audited eight-dimensional control library used for the architecture-only null, six baseline speech states, three central-difference scales, full sequence states at every complete cut, and an independently declared task-null space `K_T = span(nuisance_tone, nuisance_noise)`.\n\nCheckpoint SHA256: `{sha256}`.\n\nPrimary relative numerical-kernel threshold: `{primary_tau}`. Threshold sensitivity is reported from `{tau_grid.tolist()}`.\n\n## Primary descriptive outcomes\n\n- Initial median nuisance retention: **{nu0:.4g}**\n- Minimum median nuisance retention over depth: **{min_nu:.4g}**\n- Maximum median task defect through the minimum-nu cut: **{max_alpha_before_min:.4g}**\n- Exploratory safe-cut summary: `{json.dumps(best)}`\n- H1 descriptive support under the calibrated exploratory rule: **{H1_support}**\n- H2 strongest bottleneck support (`mu <= 0.25` at a safe cut): **{H2_support}**\n- H3 dimension-matched random-task component: **{H3_random_task_support}**\n\nThese booleans are operational summaries, not theorem-level claims. The manuscript's full H3 additionally requires comparison with the separately executed random-initialization architecture null.\n\n## Numerical discipline\n\nThe package contains full singular spectra, a nine-threshold sweep, perturbation-scale replication, complete-cut nesting residuals, and 4,000 dimension-matched random task kernels. Apparent loss is not interpreted as learned forgetting unless it is stable to these audits.\n'''
(OUT/'REPORT.md').write_text(report)
print(json.dumps(summary,indent=2)); print(agg[['cut','cut_name','nu_median','alpha_median','mu_median','fac_median','rank_median','random_p_median']].to_string(index=False))
