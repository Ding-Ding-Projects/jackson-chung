<!-- documentation-locale: {"sourceSha256":"cb4f2cca3427bb9c0b99efcb28385f977d9e0c300e4569b0617a0b6c7dc140e3","title":"交付與驗證","category":"交付與驗證","related":["docs-features-companion-README","docs-features-delivery-package-integrity"]} -->
# 交付與驗證

- [套件內容完整性](package-integrity.md)
- [已安裝驗證檢查點](installed-verification.md)

公開網站以靜態輸出部署喺 GitHub Pages。桌面助手係獨立 Windows 應用程式。瀏覽器相容功能應直接提供喺網站；原生存取係明確而可選嘅功能。

## 建置
執行 `build.bat /s` 建置靜態網站同共用呈現程式。執行 `build-installer.bat /s` 產生未簽署 Squirrel.Windows 套件。兩個入口都會傳遞子程序失敗。缺少支援嘅 Node.js 工具時，會從官方發行來源取得，並對照已刊登嘅 SHA-256 清單核實。呢個流程使用每位使用者嘅儲存空間，唔需要管理員權限。

## 證據界線
原始碼檢查、靜態輸出、部署、安裝程式封裝、已安裝操作、流動裝置互動、更新，同合約完整程度，都有獨立結果。任何成功建置都唔能夠證明其他項目。全新電腦自動準備流程，要喺可棄置嘅全新環境實際測試之後先算核實。

## 託管與公開記錄
權威公開首頁係 `https://ding-ding-projects.github.io/jackson-chung/`。聲稱發佈已核實之前，必須重新讀取實際線上部署、資產、來源中繼資料，同儲存庫 About 網站欄位。文件同 wiki 文章會直接封裝喺 `documentation.json`，供內部閱讀。

## 安全與限制
安裝程式未簽署，可能顯示未知發行者或 SmartScreen 警告。套用更新需要使用者明確操作，唔會重新啟動主機。登入憑證同私人使用者內容都唔會進入原始碼或公開證據。

## 相關文章
- [桌面助手](../companion/README.md)
- [文件索引](../../README.md)

## 驗證安裝

另外識別嘅 Squirrel 套件同確切限制，請參閱[獨立驗證安裝](isolated-installation.md)。

## Squirrel 生命週期結果

正式安裝同更新掛鉤會先建立捷徑，再登記瀏覽器原生主機。解除安裝會先移除捷徑，再取消相符原生主機嘅登記。兩個子程序都以隱藏視窗執行，逾時限制為 15 秒。即使捷徑子程序失敗，登記或取消登記仍然會執行；任何一個子程序回報錯誤、非零或缺失結束狀態，掛鉤都會以非零結束。驗證模式同過時版本掛鉤唔會啟動任何一個子程序。集中測試會執行實際擷取嘅掛鉤，涵蓋成功、失敗、逾時同無法啟動嘅子程序結果。呢啲來源測試唔代表已安裝捷徑、登錄或解除安裝驗收已通過。
