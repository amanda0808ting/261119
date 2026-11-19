let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let bgSprite; // 儲存背景圖片（bg.png/bg1.png）
let characterX; // 儲存角色一目前的水平中心位置
let bgScrollX; // 儲存中間主背景圖目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效
const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function loadSpriteWithLog(path, onLoaded) { // 包裝 loadImage 以輸出載入成功或失敗提示
  return loadImage( // 呼叫 p5.js 載入圖片函式
    path, // 傳入圖片相對路徑
    (img) => { // 圖片載入成功時執行的回呼函式
      console.log("載入成功:", path, img.width + "x" + img.height); // 在主控台顯示圖片尺寸
      if (onLoaded) onLoaded(img); // 若有額外回呼則執行
    }, // 結束成功回呼
    (err) => { // 圖片載入失敗時執行的回呼函式
      console.error("載入失敗，請檢查路徑或檔名:", path, err); // 在主控台印出錯誤路徑
    } // 結束失敗回呼
  ); // 結束 loadImage 呼叫
} // 結束圖片載入包裝函式

function preload() { // 在畫布建立前載入角色與背景圖片
  characterSprite = loadSpriteWithLog("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadSpriteWithLog("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadSpriteWithLog("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadSpriteWithLog("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
  bgSprite = loadSpriteWithLog("bg.png/bg1.png"); // 載入背景圖片 bg.png/bg1.png
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓圖片與角色座標皆代表中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  bgScrollX = width / 2; // 將中間背景圖初始中心設在畫布正中央
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function getBgBounds(bgDrawWidth) { // 依單張背景寬度計算三張串接背景的水平中心範圍
  const totalSpan = bgDrawWidth * 3; // 計算三張背景串接後的總寬度
  if (totalSpan <= width) { // 若三張串接總寬度仍小於或等於畫布寬度
    const center = width / 2; // 將中間背景固定在畫布正中央避免露邊
    return { minX: center, maxX: center }; // 回傳相同的最小與最大水平中心值
  } // 結束總寬度小於畫布判斷
  const maxX = bgDrawWidth * 1.5; // 背景往右移到底時，左側複製圖左緣對齊畫布左緣（0）
  const minX = width - bgDrawWidth * 1.5; // 背景往左移到底時，右側複製圖右緣對齊畫布右緣（width）
  return { minX, maxX }; // 回傳合法的背景中心可移動區間
} // 結束背景邊界計算函式

function draw() { // 每個畫面更新一次背景與角色
  background("#87CEEB"); // 使用天空藍清除畫布，確保畫面不會完全空白

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算適合不同裝置的移動速度

  const characterScale = (height / 3) / frameHeight; // 將角色高度設為畫布高度的 1/3 並等比縮放
  const characterWidth = frameWidth * characterScale; // 計算角色基本顯示寬度
  const characterHeight = frameHeight * characterScale; // 計算角色基本顯示高度

  const hasValidBg = Boolean(bgSprite && bgSprite.width > 0 && bgSprite.height > 0); // 檢查背景圖是否已有效載入
  let bgDrawWidth = width; // 預設單張背景寬度
  let minBgScrollX = width / 2; // 預設背景最小水平中心
  let maxBgScrollX = width / 2; // 預設背景最大水平中心

  if (hasValidBg) { // 僅在背景圖有效載入時計算捲動與邊界
    const bgScale = height / bgSprite.height; // 依畫布高度等比例計算背景縮放倍率
    bgDrawWidth = bgSprite.width * bgScale; // 依原始寬高比計算單張背景顯示寬度
    const bounds = getBgBounds(bgDrawWidth); // 取得目前畫布下的背景捲動上下限
    minBgScrollX = bounds.minX; // 設定背景往左捲動的最右邊界
    maxBgScrollX = bounds.maxX; // 設定背景往右捲動的最左邊界
    bgScrollX = constrain(bgScrollX, minBgScrollX, maxBgScrollX); // 確保背景中心不超出可捲動範圍
  } // 結束有效背景邊界計算

  if (movingRight) { // 按住右方向鍵時執行右行控制
    isWalking = true; // 切換至走路動畫
    facingDirection = 1; // 設定角色朝向右方
    if (hasValidBg && bgScrollX > minBgScrollX) { // 尚未抵達背景最右邊時，背景往左移動
      bgScrollX = max(minBgScrollX, bgScrollX - movementStep); // 往左捲動背景並限制在最右邊界內
    } else { // 已抵達背景最右邊且背景捲動暫停時，角色才往右移動
      characterX += movementStep; // 讓角色向右移動
    } // 結束右移背景與角色優先判斷
  } else if (movingLeft) { // 按住左方向鍵且未按右鍵時執行左行控制
    isWalking = true; // 切換至走路動畫
    facingDirection = -1; // 設定角色朝向左方
    if (hasValidBg && bgScrollX < maxBgScrollX) { // 尚未抵達背景最左邊時，背景往右移動
      bgScrollX = min(maxBgScrollX, bgScrollX + movementStep); // 往右捲動背景並限制在最左邊界內
    } else { // 已抵達背景最左邊且背景捲動暫停時，角色才往左移動
      characterX -= movementStep; // 讓角色向左移動
    } // 結束左移背景與角色優先判斷
  } // 結束方向鍵移動判斷

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2); // 限制角色中心避免超出畫布左右邊界

  if (hasValidBg) { // 確認背景圖片已載入後繪製三張串接背景
    const bgY = height / 2; // 將背景垂直中心對齊畫布中心
    const bgDrawHeight = height; // 設定單張背景顯示高度為整個畫布高度
    image(bgSprite, bgScrollX - bgDrawWidth, bgY, bgDrawWidth, bgDrawHeight); // 繪製左側複製背景圖
    image(bgSprite, bgScrollX, bgY, bgDrawWidth, bgDrawHeight); // 繪製中間主要背景圖
    image(bgSprite, bgScrollX + bgDrawWidth, bgY, bgDrawWidth, bgDrawHeight); // 繪製右側複製背景圖
  } // 結束三張串接背景繪製

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    }); // 在角色前方建立朝施法方向飛行的特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇施法、走路或站立精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; // 取得目前精靈圖的影格總數
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; // 取得目前精靈圖每格的寬度
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; // 取得目前精靈圖每格的高度

  if (activeSprite && activeSprite.width > 0 && activeSprite.height > 0) { // 確保目前角色精靈圖已載入完成再繪製
    const elapsedMagicFrames = frameCount - magicStartFrame; // 計算施法動畫已播放的畫面數
    const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; // 計算目前要顯示的精靈影格
    const sourceX = frameIndex * activeFrameWidth; // 計算目前影格在精靈圖中的水平起點
    const activeWidth = activeFrameWidth * characterScale; // 計算目前角色影格的顯示寬度
    const activeHeight = activeFrameHeight * characterScale; // 計算目前角色影格的顯示高度
    const characterY = height - activeHeight / 2; // 將目前角色影格底部對齊畫布底部

    push(); // 暫存目前的繪圖座標轉換狀態
    translate(characterX, characterY); // 將繪圖原點移至角色中心
    scale(isCasting ? magicDirection : facingDirection, 1); // 依施法或角色朝向決定是否水平翻轉
    image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); // 裁切並繪製目前角色影格
    pop(); // 還原繪圖座標轉換狀態
  } // 結束角色精靈圖繪製判斷

  const effectScale = characterScale; // 使用角色縮放倍率讓特效適應不同畫布
  const effectWidth = effectFrameWidth * effectScale; // 計算特效影格的顯示寬度
  const effectHeight = effectFrameHeight * effectScale; // 計算特效影格的顯示高度
  const effectSpeed = max(6, width * 0.008); // 依畫布寬度計算特效飛行速度

  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { // 由後往前更新所有飛行中的特效
    const effect = activeEffects[effectIndex]; // 取得目前更新的特效資料
    effect.x += effect.direction * effectSpeed; // 依特效方向更新水平位置
    if (effect.x > width || effect.x < 0) { // 判斷特效是否已抵達畫布左右邊緣
      activeEffects.splice(effectIndex, 1); // 移除已飛出畫布的特效
      continue; // 略過已移除特效的繪製
    } // 結束特效邊界判斷
    if (magicEffectSprite && magicEffectSprite.width > 0 && magicEffectSprite.height > 0) { // 確保魔法特效精靈圖已載入完成
      const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; // 計算特效目前播放的影格
      push(); // 暫存目前的繪圖座標轉換狀態
      translate(effect.x, effect.y); // 將繪圖原點移至特效中心
      scale(effect.direction, 1); // 依飛行方向翻轉特效影格
      image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); // 裁切並繪製目前特效影格
      pop(); // 還原繪圖座標轉換狀態
    } // 結束特效精靈圖繪製判斷
  } // 結束飛行中特效更新迴圈
} // 結束繪圖函式

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) { // 判斷是否按下右方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = 1; // 讓角色面向右方
    return false; // 防止方向鍵捲動網頁
  } // 結束右方向鍵判斷
  if (keyCode === LEFT_ARROW) { // 判斷是否按下左方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = -1; // 讓角色面向左方
    return false; // 防止方向鍵捲動網頁
  } // 結束左方向鍵判斷
  if (keyCode === 32) { // 判斷是否按下空白鍵
    if (!spaceIsDown && !isCasting) { // 僅在空白鍵新按下且角色未施法時觸發
      isCasting = true; // 開始播放施法動畫
      magicStartFrame = frameCount; // 記錄施法動畫的起始畫面
      magicDirection = facingDirection; // 鎖定施法當下角色面向
    } // 結束施法啟動判斷
    spaceIsDown = true; // 記錄空白鍵已按住以避免連續觸發
    return false; // 防止空白鍵捲動網頁
  } // 結束空白鍵判斷
} // 結束按鍵事件處理函式

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) { // 判斷放開的是否為空白鍵
    spaceIsDown = false; // 允許下次按空白鍵重新施法
  } // 結束空白鍵放開判斷
} // 結束按鍵放開事件處理函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 將畫布同步為新的視窗尺寸
  if (bgSprite && bgSprite.width > 0 && bgSprite.height > 0) { // 確保背景圖已載入再計算邊界
    const bgScale = height / bgSprite.height; // 重新計算視窗縮放後的背景縮放倍率
    const bgDrawWidth = bgSprite.width * bgScale; // 重新計算單張背景顯示寬度
    const bounds = getBgBounds(bgDrawWidth); // 重新計算合法的背景捲動區間
    bgScrollX = constrain(bgScrollX, bounds.minX, bounds.maxX); // 將背景位置限制在新的可捲動範圍內
  } // 結束背景邊界重算
  const characterScale = (height / 3) / frameHeight; // 重新計算角色縮放倍率
  const characterWidth = frameWidth * characterScale; // 重新計算角色顯示寬度
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2); // 將角色位置限制在畫布左右邊界內
} // 結束視窗縮放處理函式