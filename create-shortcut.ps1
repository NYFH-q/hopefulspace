# 一次性工具：在桌面创建「盼头空间」快捷方式（用完可以删掉本文件）
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut("$desktop\盼头空间.lnk")
$lnk.TargetPath = "$env:windir\System32\wscript.exe"
$lnk.Arguments = '"D:\个人工作台\hopefulspace\启动盼头空间.vbs"'
$lnk.Description = '盼头空间 HopefulSpace - 双击打开（自动启动本地服务器）'
$lnk.WorkingDirectory = 'D:\个人工作台\hopefulspace'
$lnk.Save()
Write-Output "shortcut created at $desktop\盼头空间.lnk"
