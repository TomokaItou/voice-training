# 原生安装包打包

这个项目可以用 Capacitor 封装成 Android 安装包。封装后它是一个真正的手机 App，界面和训练逻辑仍复用现有网页代码。

## 需要先安装

1. Node.js LTS，包含 `npm`。
2. Android Studio，安装 Android SDK、Platform Tools 和 Build Tools。
3. JDK 17 或更高版本。当前电脑已经有 Java 21。

## 第一次生成 Android 工程

```powershell
cd C:\Users\25110\Projects\code\voice-training-main\voice-training-main
npm install
npm run android:add
```

这一步会生成 `android/` 工程，并给 AndroidManifest 加上麦克风权限。

## 生成可安装 APK

```powershell
npm run android:apk
```

成功后，调试安装包通常在：

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

把这个 APK 发到 Android 手机上安装即可。第一次打开并开始训练时，需要允许麦克风权限。

## 用 Android Studio 打开

```powershell
npm run android:open
```

如果修改了网页代码，再运行：

```powershell
npm run android:sync
```

## iPhone 说明

iPhone 也可以用 Capacitor 生成 iOS 工程，但必须在 macOS + Xcode 上构建，并且真机安装需要 Apple 开发者签名。
