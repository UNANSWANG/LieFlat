/**游戏页面路径 */
export enum gamePath {
    /**游戏页面 */
    UIGame = "prefabs/UIPage/UIGame",
}

/**界面路径 */
export enum UIPath {
    /**加载页面 */
    UILoading = "UILoading",
    /**主页面 */
    UIMain = "prefabs/UIPage/UIMain",
    /**成功页面 */
    UISuccess = "prefabs/UIPage/UISuccess",
    /**失败页面 */
    UIFail = "prefabs/UIPage/UIFail",
    /**设置页面 */
    UISetting = "prefabs/UIPage/UISetting",
    /**恭喜获得页面 */
    UIReward = "prefabs/UIPage/UIReward",
    /**复访页面 */
    UIRevisit = "prefabs/UIPage/UIRevisit",
    /**排行榜 */
    UIRank = "prefabs/UIPage/UIRank",
    /**建筑道具页面 */
    UIBuild = "prefabs/UIPage/UIBuild",
    /**操作道具界面 */
    UIProps = "prefabs/UIPage/UIProps",
    /**温馨提示页面 */
    UIWarm = "prefabs/UIPage/UIWarm",
    /**控制台 */
    UIConsole = "prefabs/UIPage/UIConsole",
    /**皮肤商店 */
    UISkinStore = "prefabs/UIPage/UISkinStore",
}

/**物品路径 */
export enum ItemPath {
    /**提示 */
    tips = "prefabs/notice/tips",
    /**加载提示 */
    loadTips = "prefabs/notice/loadTips",
    /**生产提示 */
    produceTips = "prefabs/notice/produceTips",
    /**子弹 */
    bullet = "prefabs/Item/bullet",
    /**游戏通用物体 */
    gameItem = "prefabs/Item/gameItem",
    /**瓦片地图 */
    tileMap = "tileMap/map/",
}

/**地图名称 */
export const mapNameArr = [
    /**地图1 */
    "map01",
    /**地图2 */
    "map02",
]

/**物品路径 */
export enum audioPath {
    /**背景音乐 */
    background = "audio/background",
    /**游戏内点击音效 */
    click = "audio/click",
    /**单局胜利音效 */
    success = "audio/success",
}

/**图片路径 */
export enum imgPath {
    /**道具图片 */
    props = "texture/reward/props/props_",
    /**默认头像 */
    defAvatar = "texture/rank/moren",
    /**游戏内道具 */
    gamePprops = "texture/game/props/",
    /**游戏内道具预览 */
    gamePpropsPreview = "texture/build/propsPreview/",
    /**武器皮肤 */
    weaponSkin = "texture/game/weapons/weapons_",
    /**子弹皮肤 */
    bulletSkin = "texture/game/bullet/bullet_",
    /**角色头像 */
    roleAvatar = "texture/role/avatar/avatar_",
    /**角色半身 */
    roleBody = "texture/role/body/body_",
    /**角色全身 */
    roleBodyFull = "texture/role/all/all_",
}

/**spine路径 */
export enum spinePath {
    /**角色spine（文件夹） */
    role = "spine/role/role_",
    /**敌人spine（文件夹） */
    boss = "spine/boss/boss_",
    /**光罩 */
    light = "spine/light/GAZ",
    /**宝箱 */
    box = "spine/box/box",
    /**抓痕 */
    scratch = "spine/scratch/cwk",
    /**眩晕 */
    dizziness = "spine/dizziness/vertigo",
    /**警示铃 */
    alarm = "spine/alarm/Bell",
    /**金矿 */
    goldVein = "spine/goldVein/Rk",
    /**银矿 */
    silverVein = "spine/silverVein/YK",
    /**火焰锻造台 */
    fire = "spine/fire/huoyanduanzaotai",
    /**雪花 */
    snow = "spine/snow/snow",
    /**回血 */
    blood = "spine/blood/blood",
    /**发电机1 */
    generator1 = "spine/generator1/D1",
    /**发电机2 */
    generator2 = "spine/generator2/D2",
    /**发电机3 */
    generator3 = "spine/generator3/D3",
    /**发电机4 */
    generator4 = "spine/generator4/D4",
}
