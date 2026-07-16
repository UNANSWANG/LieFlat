/**娓告垙閰嶇疆 */
export const configData = {
    /**浜虹墿绉诲姩閫熷害 */
    moveSpeed: 300,
    /**娓告垙寮€濮嬪悗浜虹墿绉诲姩閫熷害 */
    moveSpeedGame: 200,
    /**鐡︾墖澶у皬 */
    tileSize: 64,
    /**浜虹墿鐨偆鏁伴噺 */
    roleSkinCount: 10,
    /**鎬墿鐨偆鏁伴噺 */
    enemySkinCount: 7,
    /**鐢熶骇閲戝竵棰戠巼锛堢锛?*/
    produceCoinFreq: 1,
    /**鐢熶骇鐢佃兘棰戠巼锛堢锛?*/ 
    producePowerFreq: 1,
    /**鐐彴鐨勬敾鍑婚棿闅?*/
    cannonAttackFreq: 1,
    /**瀛愬脊閫熷害 */
    bulletSpeed: 1000,
    /**淇鏃堕棿 */
    repairTime: 10,
    /**淇鍐峰嵈鏃堕棿 */
    repairCoolDown: 20,
    /**闂ㄥ熀纭€淇閫熷害锛堟瘡绉掍慨澶嶇櫨鍒嗘瘮锛?*/
    doorRepairSpeed: 2,
    /**闂ㄤ娇鐢ㄤ慨澶嶅鍔犵殑淇閫熷害锛堟瘡绉掍慨澶嶇櫨鍒嗘瘮锛?*/
    doorRepairSpeedAdd: 3,
    /**鎴块棿鏈夐殢鏈洪亾鍏锋鐜?*/
    roomPropsProbability: 0.8,
    /**闅忔満閬撳叿鐨勭敓鎴愭暟閲忓尯闂?*/
    randomPropsNum: [3, 4],
    /**鎴块棬琛€鏉℃樉绀烘椂闂达紙绉掞級 */
    doorHpShowTime: 5,
}

/**鏁屼汉閫氱敤閰嶇疆 */
export const enemyCommonConfig = {
    /**鏁屼汉绉诲姩閫熷害 */
    enemyMoveSpeed: 400,
    /**鏁屼汉寮€濮嬫椂闂达紙绉掞級 */
    enemyStartTime: 25,
    /**鏁屼汉琛€閲忓洖澶嶉€熷害锛堟瘡绉掑洖澶嶇櫨鍒嗘瘮锛?*/
    enemyHpRepairSpeed: 10,
    /**鏁屼汉閫冭蛋鐢熷懡鍊兼瘮渚?*/
    enemyEscapeHpPercent: 0.3,
    /**鏁屼汉浣跨敤闇囨厬鏃剁殑闂ㄧ敓鍛界櫨鍒嗘瘮锛堝皬浜庯級 */
    doorEscapeHpPercent: 0.2,
    /**鏁屼汉浣跨敤闇囨厬鏃剁殑鑷韩鐢熷懡鐧惧垎姣?澶т簬) */
    selfEscapeHpPercent: 0.3,
    /**闇囨厬鑼冨洿锛堟牸鏁帮級 */
    fearRange: 4,
    /**闇囨厬鏃堕棿锛堢锛?*/
    fearTime: 3,
    /**鐙傛€掓妧鑳芥敾閫熷€嶇巼 */
    rageAttackSpeed: 2,
    /**鐙傛€掓妧鑳芥寔缁椂闂?*/
    rageTime: 3,
    /**鐙傛€掓妧鑳戒娇鐢ㄩ棿闅?*/
    rageUseInterval: 30,
    /**鏁屼汉鏀诲嚮鏃惰閲忔娴嬮槇鍊肩櫨鍒嗘瘮锛堟娴嬮€冪锛?*/
    enemyHpAttackPercent: 0.3,
    /**鎴块棬琚敾鍑昏閲忔娴嬮槇鍊肩櫨鍒嗘瘮 */
    doorHpAttackPercent: 0.2,
    /**鐮撮棬鍚庤嚜韬閲忛槇鍊肩櫨鍒嗘瘮 */
    goalHpThresholdPercent: 0.2,
    /**鎴块棬鏀诲嚮鏃堕棿妫€娴嬮槇鍊?*/
    doorAttackTimeThreshold: 20,
    /**鎴块棬琚敾鍑荤殑妫€娴嬫椂闂达紙浼ゅ锛?*/
    doorAttackTimeDamage: 10,
    /**鎴块棬琚敾鍑荤殑绉掍激闃堝€肩櫨鍒嗘瘮 */
    doorAttackTimeDamagePercent: 0.05,
    /**鍥炲埌鍑虹敓鐐圭殑绛夊緟鏃堕棿锛堢锛?*/
    returnStartTime: 10,
    /**鏁屼汉鏀诲嚮闂撮殧鍊嶇巼鍖洪棿 */
    enemyAttackInterval: [1.25, 1.75],
}

/**浜烘満閫氱敤閰嶇疆 */
export const robotCommonConfig = {
    /**鍙戠數鏈哄缓閫犲墠鎻愶紙鏃堕棿绾跨瓑绾э級 */
    generatorBuildLevel: 5,
    /**鍙戠數鏈轰笂闄愶紙涓暟锛?*/
    generatorMax: 4,
    /**鍙戠數鏈哄缓閫犻棿闅旓紙绉掞級 */
    generatorBuildInterval: [15, 25],
    /**鍗囩骇鍙戠數鏈哄墠鎻愭潯浠讹紙搴婄瓑绾э紝瀹為檯8绾х殑鏃跺€檒evel=7鍥犱负浠?寮€濮嬶級 */
    generatorBuildBedLevel: 8,
    /**鍗囩骇鍙戠數鏈洪棿闅旓紙绉掞級 */
    generatorUpgradeInterval: [30, 60],
    /**鍙戠數鏈烘渶楂樼瓑绾?*/
    generatorMaxLevel: 5,
    /**鐭胯剦鐨勫缓閫犲墠鎻愶紙鍙戠數鏈烘渶楂樼瓑绾э紝瀹為檯3绾х殑鏃跺€檒evel=2鍥犱负浠?寮€濮嬶級 */
    veinBuildLevel: 3,
    /**鐭胯剦鐨勫缓閫犻棿闅旓紙绉掞級 */
    veinBuildInterval: [30, 60],
    /**鐭胯剦鐨勬渶澶т笂闄愶紙涓暟锛?*/
    veinMax: 2,
    /**鐭胯剦鍚勭瓑绾у缓閫犳潈閲?*/
    veinBuildWeight: [0.95, 0.03, 0.02, 0.01],

    /**琚€墿鏀诲嚮鏃舵娴嬬殑鏃堕棿闃堝€硷紙浠庡€掕鏃剁粨鏉熷悗寮€濮嬭鏃讹紝鍖哄垎鍓嶆湡鍜屽悗鏈燂級 */
    enemyAttackTimeThreshold: 40,
    /**鍓嶆湡鍗囩骇闂ㄧ殑娆℃暟涓婇檺 */
    enemyUpgradeDoorMax: 2,
    /**鍓嶆湡琚敾鍑绘椂鍗囩骇闂ㄧ殑鏃堕棿闂撮殧锛堢锛?*/
    enemyAttackTimeUpgrade: 20,
    /**闂ㄦ帀琛€閫熺巼闃堝€?鍗曟浼ゅ鐧惧垎姣? */
    doorHpAttackPercent: 0.05,
    /** 鐐彴寤洪€犵殑璺濈锛堟牸鏁帮級 */
    cannonBuildDistance: 4,
    /**鐐彴寤洪€犵殑鏃堕棿闃堝€硷紙鐢ㄤ互鍖哄垎鐐彴鐨勫墠鍗婃鏃堕棿锛?*/
    cannonBuildTimeThreshold: [10, 100],
    /**鍓嶅崐娈电偖鍙扮殑鏈€楂樼瓑绾?*/
    cannonBuildLevel: 3,
    /**鍓嶅崐娈电偖鍙扮殑鍗囩骇鍐峰嵈鏃堕棿锛堢锛?*/
    cannonBuildUpgradeCoolDown: 5,
    /**鐐彴鍚庡崐娈靛缓閫犵殑鏃堕棿闃堝€硷紙鐢ㄤ互鍖哄垎鐐彴鐨勫悗鍗婃鏃堕棿锛?*/
    cannonBuildTimeThresholdLater: 120,
    /**鍚庡崐娈电偖鍙扮殑鏈€楂樼瓑绾?*/
    cannonBuildLevelLater: 5,
    /**鍚庡崐娈电偖鍙扮殑鍗囩骇鍐峰嵈鏃堕棿锛堢锛?*/
    cannonBuildUpgradeCoolDownLater: 10,
    /**鍚庢湡闂ㄦ帀琛€閫熷害杩囧揩鏃讹紝鐢熸垚閬撳叿鐨勭殑鏃堕棿 */
    propsBuildTimedLater: 20,
    /**寤洪€犳満搴婄殑鍓嶆彁鏃堕棿锛堢锛?*/
    machineBuildTimeThreshold: 180,
    /**寤洪€犲瘨鍐扮殑鍓嶆彁鏃堕棿锛堢锛?*/
    iceBuildTimeThreshold: 240,
    /**妫€娴嬮槦鍙嬭鏀诲嚮鑼冨洿锛堟牸鏁帮級 */
    checkTeamRange: 10,
    /**闃熷弸琚敾鍑绘椂鍙崌绾х殑鏈€澶х瓑绾х偖鍙?*/
    maxUpgradeCannonLevel: 2,
}


/**娓告垙浜嬩欢 */
export enum GameEvent {
    /**娓告垙鏆傚仠 */
    gamePause = "gamePause",
    /**娓告垙缁х画 */
    gameResume = "gameResume",
    /**鍒锋柊绾㈢偣 */
    refreshRed = "refreshRed",
    /**鍔犺浇琛ㄦ牸 */
    loadTable = "loadTable",
    /**妫€娴嬬櫥褰曢〉鍔犺浇鍥炶皟 */
    checkLoginLoad = "checkLoginLoad",
    /**鍏ㄩ儴琛ㄦ牸鍔犺浇瀹屾垚鍥炶皟 */
    tableLoadComplete = "tableLoadComplete",
    /**鍔犺浇棰勫埗浣?*/
    loading = "loading",
    /**鍒锋柊娓告垙鍏冲崱 */
    refreshGameLevel = "refreshGameLevel",
    /**澶嶆椿娓告垙 */
    resurrectionGame = "resurrectionGame",
    /**鍒锋柊閬撳叿 */
    refreshProps = "refreshProps",
    /**鍏抽棴濂栧姳鐣岄潰 */
    closeRewardPage = "closeRewardPage",
    /**渚ц竟鏍忓洖璁?*/
    revisitSidebar = "revisitSidebar",
    /**鍒锋柊娓告垙鎽勫儚鏈鸿瑙?*/
    refreshGameCamera = "refreshGameCamera",
    /**鍒锋柊娓告垙鍐呰揣甯侊紙鍦哄唴锛?*/
    refreshGameMonetary = "refreshGameMonetary",
    /**鍒锋柊鐜╁鍧愭爣浜嬩欢 */
    refreshPlayerPos = "refreshPlayerPos",
    /**鐢熸垚寤虹瓚閬撳叿 */
    createProps = "createProps",
    /**鍗囩骇寤虹瓚閬撳叿 */
    upgradeProps = "upgradeProps",
    /**閫氱敤閰嶇疆琛ㄥ姞杞藉畬鎴?*/
    commonTableFinish = "commonTableFinish",
    /**娓告垙鍐呭鍔犺揣甯?*/
    addGameMonetary = "addGameMonetary",
    /**鍏ㄧ毊鑲?*/
    fullSkin = "fullSkin",
}

/**瀛樺偍鐨勯敭鍊?*/
export enum SaveKey {
    /**鍏冲崱鏁版嵁 */
    level = "level",
    /**娓告垙澶栬揣甯侊紙鍦哄锛?*/
    money = "money",
    /**闊虫晥寮€鍏?*/
    effect = "effect",
    /**闊虫晥闊抽噺 */
    effectVolume = "effectVolume",
    /**闊充箰寮€鍏?*/
    music = "music",
    /**闊充箰闊抽噺 */
    musicVolume = "musicVolume",
    /**鎸姩寮€鍏?*/
    vibrat = "vibrat",
    /**閬撳叿瀛樺偍 */
    props = "props",
    /**浠婃棩鏄惁棰嗗彇杩囦晶杈规爮濂栧姳 */
    isGetRevisit = "isGetRevisit",
    /**鐢ㄦ埛澶村儚 */
    avatarUrl = "avatarUrl",
    /**浠婃棩鏄惁寮瑰嚭杩囨俯棣ㄦ彁绀?*/
    isShowWarm = "isShowWarm",
    passCount = "passCount",
    unlockedRoleSkin = "unlockedRoleSkin",
    useRoleSkinId = "useRoleSkinId",
}

/**閬撳叿绱㈠紩 */
export enum PropsName {

}



