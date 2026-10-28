# 盼头空间 · 一键启动脚本（由桌面快捷方式经 VBS 隐藏调用）
# 逻辑：5173 端口已在监听 → 直接打开浏览器；
#       没有在监听 → 隐藏窗口启动 npm run dev，等它就绪后打开浏览器。

$projectDir = 'D:\个人工作台\hopefulspace'
$url = 'http://localhost:5173'

function Test-PortBusy {
  (netstat -ano | Select-String ':5173' | Select-String 'LISTENING') -ne $null
}

if (Test-PortBusy) {
  Start-Process $url
  exit
}

# 用隐藏的 cmd 窗口跑 npm run dev（不打扰桌面）
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $projectDir -WindowStyle Hidden

# 等端口就绪（最多 30 秒）
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Test-PortBusy) { break }
}

# 无论是否就绪都打开浏览器（超时则用户会看到页面连不上，可手动检查终端）
Start-Process $url
