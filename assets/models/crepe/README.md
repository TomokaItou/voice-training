# CREPE Model Files

Place a TensorFlow.js model converted from CREPE here:

- `assets/models/crepe/model.json`
- any shard files referenced by `model.json`

The bundled provider supports TFJS GraphModel and LayersModel formats. When the
model is present, `crepe-tfjs-provider.js` automatically registers the
`crepe-tfjs` provider. Until then, selecting CREPE uses the existing YIN fallback.
