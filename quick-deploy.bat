@echo off
echo ========================================
echo   INVENTORY GENIE - QUICK HTTPS DEPLOY
echo ========================================
echo.
echo Choose deployment method:
echo.
echo 1. Vercel (Fastest - 2 minutes)
echo 2. Netlify (Drag & Drop - 1 minute)  
echo 3. Show deployment instructions
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Deploying to Vercel...
    echo You'll need to login with GitHub/Google
    echo.
    vercel --prod
    echo.
    echo ✅ Deployment complete! Your HTTPS URL is shown above.
    echo Share this URL with anyone worldwide!
) else if "%choice%"=="2" (
    echo.
    echo Building for Netlify...
    npm run build
    echo.
    echo ✅ Build complete!
    echo.
    echo Next steps:
    echo 1. Go to https://netlify.com/drop
    echo 2. Drag the 'build' folder to the page
    echo 3. Get your HTTPS URL instantly!
    echo.
    explorer build
) else if "%choice%"=="3" (
    echo.
    echo Opening deployment instructions...
    notepad deploy-instructions.md
) else (
    echo Invalid choice. Please run again.
)

echo.
pause