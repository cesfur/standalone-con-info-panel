set PS_ROOT=%~dp0
set PS_MSGBOX=cscript "%PS_ROOT%script\msgbox.vbs" 
set PS_CONVERT="%PS_ROOT%im\convert"
set PS_INPUT=%PS_ROOT%input\
set PS_CONVERTED=%PS_ROOT%converted\
set PS_LIST=%PS_CONVERTED%photos.txt
set PS_TARGET=%PS_ROOT%
set PS_TARGET_LIST=%PS_ROOT%..\photos.txt
set PS_LOG="%PS_CONVERTED%log.txt"

if not exist "%PS_INPUT%" mkdir "%PS_INPUT%"
if not exist "%PS_CONVERTED%" mkdir "%PS_CONVERTED%"
del "%PS_CONVERTED%*.*" /F /Q

%PS_MSGBOX% "Copy photos to the INPUT folder: %PS_INPUT%  Then, press OK."

dir /B "%PS_INPUT%*.jpg" > "%PS_LIST%"
date /T > %PS_LOG%
time /T >> %PS_LOG%
for /F "tokens=*" %%A in (%PS_LIST%) do (
    echo %%A >> %PS_LOG%
    %PS_CONVERT% -auto-orient -resize 1280x720 "%PS_INPUT%%%A" "%PS_CONVERTED%%%A" 2>> %PS_LOG%
)
echo Done >> %PS_LOG%

del "%PS_ROOT%*.jpg" /F /Q
move /Y "%PS_CONVERTED%*.jpg" "%PS_ROOT%"
move /Y "%PS_LIST%" "%PS_TARGET_LIST%"

%PS_MSGBOX% "Photo published. Press OK to finish."
