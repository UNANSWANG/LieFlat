import { _decorator, AnimationClip, Camera, Canvas, EventKeyboard, EventTouch, Input, input, instantiate, KeyCode, Label, Layout, Node, UITransform, Vec2, Vec3, NodeEventType, director, TiledMap, TiledObjectGroup, Prefab, view, Sprite, Tween, TiledMapAsset, UIOpacity, tween, sp } from 'cc';
import { uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { UIBase } from './UIBase';
import { audioPath, imgPath, ItemPath, mapNameArr, spinePath, UIPath } from '../manager/pathConfig';
import { configData, enemyCommonConfig, GameEvent, robotCommonConfig } from '../manager/configData';
import { gm } from '../manager/gm';
import { zoomButton } from '../extention/zoomButton';
import { ccTools } from '../extention/generalTools';
import { ccResTools } from '../extention/resTools';
import { playerMgr } from '../manager/playerManager';
import { tileItemController, tilePropsType } from '../controller/tileItemController';
import { doorProps } from '../controller/props/doorProps';
import { bedProps } from '../controller/props/bedProps';
import { thornProps } from '../controller/props/thornProps';
import { iceProps } from '../controller/props/iceProps';
import { CameraController } from '../controller/CameraController';
import { roleAnimName, roleController, roleState } from '../controller/roleController';
import { enemyMgr } from '../manager/enemyManager';
import { enemyBaseController } from '../controller/enemy/enemyBaseController';
import { produceTips, produceType } from './tips/produceTips';
import { poolMgr } from '../manager/poolManager';
import { JsonPropsData, propsConfig } from '../json/jsonProps';
import { bulletController } from '../controller/bulletController';
import { cageController } from '../controller/cageController';
import { netController } from '../controller/netController';
import { sawController } from '../controller/sawController';
import { gameAnimController } from '../controller/gameAnimController';
import { coverProps } from '../controller/props/coverProps';
import { audioMgr } from '../manager/audioManager';
import { bossConfig, JsonBossData } from '../json/jsonBoss';
const { ccclass, property } = _decorator;
const GUIDE_MAP_NAME = "map05";
const GUIDE_ROOM_IDX = 8;
const ROLE_BUTTON_STATE_REFRESH_INTERVAL = 0.1;

enum guideTaskType {
    none,
    doorUpgrade,
    bedUpgrade,
    cannonBuild,
    generatorBuild,
}

@ccclass('UIGame')
export class UIGame extends UIBase {
    @property(Node)
    setBtn: Node;

    @property(Node)
    repairBtn: Node;

    @property(Node)
    roleNode: Node;

    @property(Node)
    rockerTouchNode: Node;

    @property(Node)
    slideTouchNode: Node;

    @property(Node)
    tileObjList: Node;

    @property(Node)
    UINode: Node;

    @property(Node)
    gameBottomUINode: Node;

    @property(Node)
    gameUINode: Node;

    @property(Prefab)
    roleBtnPre: Prefab;

    @property(Prefab)
    rolePre: Prefab;

    @property(Prefab)
    enemyPre: Prefab;

    @property(Prefab)
    tileItemPre: Prefab;

    @property(TiledMap)
    tiledMap: TiledMap;

    @property(Label)
    coinLab: Label;

    @property(Label)
    powerLab: Label;

    @property(Node)
    timeNode: Node;

    @property(Node)
    roleBtnLayout: Node;

    @property(Node)
    skillNode: Node;

    @property(Node)
    monetaryNode: Node;

    @property(Node)
    maksNode: Node;

    ///
    ///需要获取的节点
    ///
    oprateBtn: Node = null;
    touchSelect: Node = null;
    /**上床按钮引导节点 */
    private bedGuideNode: Node = null;
    /**上床按钮引导动画 */
    private bedGuideSkeleton: sp.Skeleton = null;
    /**上床按钮引导动画是否正在播放 */
    private isBedGuidePlaying = false;
    /**是否已上报上床引导开始 */
    private hasReportedEnterBedGuideStart = false;
    /**是否已上报上床引导完成 */
    private hasReportedEnterBedGuideFinish = false;

    ///
    ///属性
    ///
    /**机器人数组 */
    robotArr: roleController[] = [];
    /**剩余倒计时时间 */
    countDownTime = 0;
    /**是否开始倒计时 */
    isCountDownStart = false;
    /**当前移动方向 */
    private currentMoveDirection: Vec3 = new Vec3();
    /**是否正在移动 */
    private isMoving = false;
    /**摇杆初始位置 */
    private rockerInitPos: Vec3 = new Vec3(0, -650, 0);
    /**出生点位数组 */
    private bornPosArr: Vec2[] = [];
    /**随机道具点位数组 */
    private randomPropsPosArr: Vec2[] = [];
    /**障碍物地图*/
    tileMap: tileData[][] = [];
    /**所有房间信息 */
    roomMap: any = {};
    /**操作按钮的坐标 */
    opratePos: Vec2 = Vec2.ZERO;
    /**当前操作按钮行为 */
    private oprateAction: "operate" | "pickup" = "operate";
    pickupBtnScreenOffsetY: number = 50;
    /**携带道具相对玩家节点的位置，y会按角色动画高度动态计算 */
    private carriedPropsLocalPos: Vec3 = new Vec3(0, 0, 0);
    /**玩家当前携带的随机道具 */
    private carriedRandomProps: carriedRandomPropsData = null;
    /**地图层相机，用于把瓦片世界坐标转成屏幕坐标 */
    private gameCamera: Camera = null;
    /**地图层相机控制器 */
    private gameCameraComp: CameraController = null;
    /**UI层相机，用于把屏幕坐标转回UI世界坐标 */
    private uiCamera: Camera = null;
    /**游戏摄像机到UI摄像机的视角比例 */
    private gameToUICameraScale = 1;
    /**是否因铡刀触发锁定游戏视角 */
    private isCameraLockedBySaw = false;
    /**选中坐标 */
    private selectedPos: Vec2 = new Vec2();

    ///
    ///临时变量，不参与重新开始游戏数据恢复
    ///
    /**操作瓦片中心点的世界坐标 */
    private tempTileCenterWorldPos: Vec3 = new Vec3();
    /**角色当前世界坐标 */
    private tempPlayerWorldPos: Vec3 = new Vec3();
    /**角色当前屏幕坐标 */
    private tempPlayerScreenPos: Vec3 = new Vec3();
    /**操作按钮目标屏幕坐标 */
    private tempScreenPos: Vec3 = new Vec3();
    /**操作按钮目标UI世界坐标 */
    private tempUIWorldPos: Vec3 = new Vec3();
    /**操作按钮目标UI本地坐标 */
    private tempUILocalPos: Vec3 = new Vec3();
    /**瓦片中心点在地图节点内的本地坐标 */
    private tempTileCenterLocalPos: Vec3 = new Vec3();
    /**游戏相机世界坐标 */
    private tempCameraWorldPos: Vec3 = new Vec3();
    /**触摸点对应的地图世界坐标 */
    private tempTouchWorldPos: Vec3 = new Vec3();
    /**触摸点对应的地图节点本地坐标 */
    private tempTouchMapLocalPos: Vec3 = new Vec3();
    /**滑动区域移动距离 */
    private tempSlideDelta: Vec2 = new Vec2();
    /**滑动区域开始触摸UI坐标 */
    private slideStartUILocation: Vec2 = new Vec2();
    /**滑动区域上一帧UI坐标 */
    private slideLastUILocation: Vec2 = new Vec2();
    /**玩家每帧移动偏移 */
    private tempPlayerMoveOffset: Vec3 = new Vec3();
    /**玩家碰撞限制后的坐标 */
    private tempLimitedPlayerPos: Vec3 = new Vec3();
    /**玩家碰撞检测所在瓦片 */
    private tempCurrentMoveTilePos: Vec2 = new Vec2();
    /**玩家碰撞矩形默认偏移 */
    private readonly defaultMoveMatrixOffset: Vec2 = new Vec2(0, 8);
    /**等待玩家碰撞区域离开后恢复阻挡的门格 */
    private pendingDoorBlockPosMap: { [key: string]: Vec2 } = {};
    /**每扇门当前正在攻击的敌人数量 */
    private doorAttackerCountMap: { [key: string]: number } = {};
    /**引导路径瓦片对应的箭头节点 */
    private guideArrowNodeMap: { [key: string]: Node } = {};
    /**当前唯一允许显示的操作引导 */
    private currentGuideTask: guideTaskType = guideTaskType.none;
    /**已达成条件但仍在等待显示的操作引导 */
    private pendingGuideTaskQueue: guideTaskType[] = [];
    /**引导关门上的点击手指 */
    private guideDoorClickNode: Node = null;
    /**是否已触发首次门升级引导 */
    private isGuideDoorUpgradeReady = false;
    /**是否已完成首次门升级 */
    private isGuideDoorUpgradeComplete = false;
    /**门升级引导期间是否已打开道具界面 */
    private isGuideDoorUpgradeUIOpen = false;
    /**引导关床上的点击手指 */
    private guideBedClickNode: Node = null;
    /**是否已触发首次床升级引导 */
    private isGuideBedUpgradeReady = false;
    /**是否已完成或跳过首次床升级引导 */
    private isGuideBedUpgradeComplete = false;
    /**床升级引导期间是否已打开道具界面 */
    private isGuideBedUpgradeUIOpen = false;
    /**发电机建造引导所指向的空闲瓦片 */
    private guideGeneratorBuildTilePos: Vec2 = null;
    /**空闲瓦片上的发电机建造点击手指 */
    private guideGeneratorBuildClickNode: Node = null;
    /**是否已触发首次发电机建造引导 */
    private isGuideGeneratorBuildReady = false;
    /**是否已完成或跳过首次发电机建造引导 */
    private isGuideGeneratorBuildComplete = false;
    /**发电机建造引导期间是否已打开建造界面 */
    private isGuideGeneratorBuildUIOpen = false;
    /**炮台建造引导所指向的空闲瓦片 */
    private guideCannonBuildTilePos: Vec2 = null;
    /**空闲瓦片上的炮台建造点击手指 */
    private guideCannonBuildClickNode: Node = null;
    /**玩家引导房门是否已被Boss首次攻击 */
    private hasGuidePlayerDoorBeenAttacked = false;
    /**是否已触发首次炮台建造引导 */
    private isGuideCannonBuildReady = false;
    /**是否已完成或跳过首次炮台建造引导 */
    private isGuideCannonBuildComplete = false;
    /**炮台建造引导期间是否已打开建造界面 */
    private isGuideCannonBuildUIOpen = false;
    /**是否在滑动区域移动 */
    private isSlideMoving = false;
    /**游戏开始倒计时时间 */
    private gameStartCountDownTime = 0;
    /**游戏开始倒计时是否已结束 */
    private isGameStartCountDownEnd = false;
    /**游戏是否暂停 */
    private isGamePause = false;
    /**修复按钮冷却剩余时间 */
    private repairCoolDownTime = 0;
    /**修复按钮冷却遮罩 */
    private repairMask: Sprite = null;
    /**技能按钮冷却剩余时间，索引与 skillNode 子节点保持一致 */
    private skillCoolDownTimes: number[] = [];
    /**各机器人开始找房间剩余时间 */
    private robotSuchRoomDelayMap: Map<roleController, number> = new Map();
    /**玩家上一帧所在房间 */
    private playerLastRoomIdx = 0;
    /**倒计时结束后的游戏经过时间 */
    private gameStartElapsedTime = 0;
    /**当前地图资源名称 */
    private currentMapName = "";
    /**当前游戏局序号，用于避免异步加载回写旧局 */
    private openVersion = 0;
    /**匹配界面产生的机器人皮肤 */
    private matchRoleSkinIds: number[] = [];
    /**匹配界面产生的机器人昵称 */
    private matchRoleNicknames: string[] = [];
    /**匹配界面产生的敌人皮肤 */
    private matchEnemySkinId: number = null;
    /**匹配界面产生的敌人昵称 */
    private matchEnemyNickname = "";
    /**敌人模式中由玩家控制的敌人 */
    private controlledEnemy: enemyBaseController = null;
    /**敌人模式倒计时结束后是否持续跟随敌人 */
    private isEnemyCameraFollowing = false;
    /**敌人模式中六个机器人的难度类型，每种被抽中的类型恰好分配两人 */
    private enemyModeRobotDifficultyTypes: number[] = [];
    /**敌人模式是否已进入结算，防止最后一次击杀重复弹窗 */
    private isEnemyModeGameOver = false;

    private get isEnemyMode() {
        return pData.matchMode == 1;
    }
    /**主角死亡消失动画是否正在播放 */
    isRoleDisappearPlaying: boolean = false;
    /**角色头像按钮状态 */
    private roleBtnStateMap: { [roleId: number]: roleBtnStateData } = {};
    /**正在受攻击的房间，复用集合避免刷新时产生临时对象 */
    private attackedRoomSet: Set<number> = new Set();
    /**角色头像状态刷新计时 */
    private roleBtnStateRefreshTimer = ROLE_BUTTON_STATE_REFRESH_INTERVAL;
    protected onLoad(): void {
        this.oprateBtn = this.UINode.getChildByName('oprateBtn');
        this.touchSelect = this.UINode.getChildByName('touchSelect');
        this.repairMask = this.repairBtn.getChildByName("mask").getComponent(Sprite);
        this.bedGuideNode = this.oprateBtn.getChildByName("guideNode");
        this.bedGuideSkeleton = this.bedGuideNode?.getComponent(sp.Skeleton);
        this.refreshBedGuideVisible(false);

        this.bindBtn();
        this.initCamera();
        audioMgr.initSceneAudio(this.node);
    }

    async onUI_Open(data?: any) {
        ++this.openVersion;
        //获取匹配界面随机出的皮肤id
        this.matchRoleSkinIds = Array.isArray(data?.roleSkinIds)
            ? data.roleSkinIds.filter((skinId) => Number.isInteger(skinId) && skinId >= 0).slice(0, 6)
            : [];
        this.matchRoleNicknames = Array.isArray(data?.roleNicknames)
            ? data.roleNicknames.slice(0, 6).map((nickname) => typeof nickname == "string" ? nickname.trim() : "")
            : [];
        this.matchEnemySkinId = Number.isInteger(data?.enemySkinId) && data.enemySkinId >= 0
            ? data.enemySkinId
            : null;
        this.matchEnemyNickname = typeof data?.enemyNickname == "string" ? data.enemyNickname.trim() : "";
        this.addListener();
        this.restartGame();
    }

    onUI_Close(): void {
        audioMgr.stopSceneEffects();
        // 先提升版本号，使本局尚未完成的异步地图加载结果失效
        this.openVersion++;
        this.removeListener();
        this.clearData();
        this.releaseCurrentTiledMap();
        this.matchRoleSkinIds = [];
        this.matchRoleNicknames = [];
        this.matchEnemySkinId = null;
        this.matchEnemyNickname = "";
    }

    /**随机并装配瓦片地图 */
    private async randomTiledMap(version: number) {
        if (!this.tiledMap || !uiMgr.resBundle || mapNameArr.length <= 0) {
            return false;
        }

        let randomIdx = Math.floor(Math.random() * mapNameArr.length);
        let mapName = pData.isGuide ? GUIDE_MAP_NAME : mapNameArr[randomIdx];
        let mapAsset: TiledMapAsset = await ccResTools.loadTiledMap(uiMgr.resBundle, ItemPath.tileMap + mapName);
        // 页面关闭或新一局开始后，旧请求不能再覆盖当前地图
        if (!mapAsset || version != this.openVersion || !this.node.activeInHierarchy) {
            return false;
        }

        this.currentMapName = mapName;
        this.tiledMap.tmxAsset = mapAsset;
        return true;
    }

    /**释放本局地图及其依赖，避免多局后缓存全部候选地图 */
    private releaseCurrentTiledMap() {
        if (this.tiledMap) {
            this.tiledMap.tmxAsset = null;
        }
        if (this.currentMapName && uiMgr.resBundle) {
            uiMgr.resBundle.release(ItemPath.tileMap + this.currentMapName, TiledMapAsset);
        }
        this.currentMapName = "";
    }

    /**重新开始单局 */
    private async restartGame() {
        // 每次重开都先作废上一局的异步任务并立即清场，不能等新地图加载完成后再清理
        let version = ++this.openVersion;
        this.clearData();
        this.releaseCurrentTiledMap();
        pData.levelInit();
        let mapReady = await this.randomTiledMap(version);
        if (version != this.openVersion || !this.node.activeInHierarchy) {
            return;
        }

        if (!mapReady) {
            console.error("随机地图加载失败，无法初始化游戏");
            return;
        }

        this.initData();
    }

    /**添加监听 */
    addListener() {
        gm.Event.on(GameEvent.refreshGameLevel, this.restartGame, this);
        gm.Event.on(GameEvent.refreshGameCamera, this.refreshGameCamera, this);
        gm.Event.on(GameEvent.refreshGameMonetary, this.refreshMonetaryLab, this);
        gm.Event.on(GameEvent.refreshPlayerPos, this.checkPlayerPos, this);
        gm.Event.on(GameEvent.createProps, this.createProps, this);
        gm.Event.on(GameEvent.upgradeProps, this.upgradeProps, this);
        gm.Event.on(GameEvent.gamePause, this.onGamePause, this);
        gm.Event.on(GameEvent.gameResume, this.onGameResume, this);
        gm.Event.on(GameEvent.addGameMonetary, this.addGameMonetary, this);
        gm.Event.on(GameEvent.forceStart, this.forceStartGame, this);
        // 监听键盘按下
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        // 监听触摸事件
        this.rockerTouchNode.on(NodeEventType.TOUCH_START, this.onTouchRockerStart, this);
        this.rockerTouchNode.on(NodeEventType.TOUCH_MOVE, this.onTouchRockerMove, this);
        this.rockerTouchNode.on(NodeEventType.TOUCH_END, this.onTouchRockerEnd, this);
        this.rockerTouchNode.on(NodeEventType.TOUCH_CANCEL, this.onTouchRockerEnd, this);
        this.slideTouchNode.on(NodeEventType.TOUCH_START, this.onTouchSlideStart, this);
        this.slideTouchNode.on(NodeEventType.TOUCH_MOVE, this.onTouchSlideMove, this);
        this.slideTouchNode.on(NodeEventType.TOUCH_END, this.onTouchSlideEnd, this);
        this.slideTouchNode.on(NodeEventType.TOUCH_CANCEL, this.onTouchSlideEnd, this);
    }

    /**删除监听 */
    removeListener() {
        gm.Event.off(GameEvent.refreshGameLevel, this.restartGame, this);
        gm.Event.off(GameEvent.refreshGameCamera, this.refreshGameCamera, this);
        gm.Event.off(GameEvent.refreshGameMonetary, this.refreshMonetaryLab, this);
        gm.Event.off(GameEvent.refreshPlayerPos, this.checkPlayerPos, this);
        gm.Event.off(GameEvent.createProps, this.createProps, this);
        gm.Event.off(GameEvent.upgradeProps, this.upgradeProps, this);
        gm.Event.off(GameEvent.gamePause, this.onGamePause, this);
        gm.Event.off(GameEvent.gameResume, this.onGameResume, this);
        gm.Event.off(GameEvent.addGameMonetary, this.addGameMonetary, this);
        gm.Event.off(GameEvent.forceStart, this.forceStartGame, this);
        // 监听键盘按下
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        // 监听触摸事件
        this.rockerTouchNode.off(NodeEventType.TOUCH_START, this.onTouchRockerStart, this);
        this.rockerTouchNode.off(NodeEventType.TOUCH_MOVE, this.onTouchRockerMove, this);
        this.rockerTouchNode.off(NodeEventType.TOUCH_END, this.onTouchRockerEnd, this);
        this.rockerTouchNode.off(NodeEventType.TOUCH_CANCEL, this.onTouchRockerEnd, this);
        this.slideTouchNode.off(NodeEventType.TOUCH_START, this.onTouchSlideStart, this);
        this.slideTouchNode.off(NodeEventType.TOUCH_MOVE, this.onTouchSlideMove, this);
        this.slideTouchNode.off(NodeEventType.TOUCH_END, this.onTouchSlideEnd, this);
        this.slideTouchNode.off(NodeEventType.TOUCH_CANCEL, this.onTouchSlideEnd, this);
    }

    bindBtn() {
        this.setBtn.addComponent(zoomButton).onClick = this.clickSetBtn.bind(this);
        this.oprateBtn.on(NodeEventType.TOUCH_END, this.clickOprateBtn, this);
        this.repairBtn.addComponent(zoomButton).onClick = this.clickRepairBtn.bind(this);
        for(let i = 0; i < this.skillNode.children.length; i++){
            let btn = this.skillNode.children[i];
            btn.addComponent(zoomButton).onClick = this.clickSkillBtn.bind(this, i);
        }
    }

    initCamera() {
        let gameCamera = this.node.getChildByName("gameCamera");
        this.gameCameraComp = gameCamera?.getComponent(CameraController);
        this.gameCamera = gameCamera?.getComponent(Camera);

        let canvas = director.getScene()?.getChildByName("Canvas")?.getComponent(Canvas);
        this.uiCamera = canvas?.cameraComponent;
        this.updateGameToUICameraScale();
    }

    /**游戏摄像机内容换算到UI摄像机时使用的缩放比例 */
    get gameToUIViewScale() {
        return this.gameToUICameraScale;
    }

    /**记录游戏摄像机与UI摄像机的视角比例 */
    private updateGameToUICameraScale() {
        if (!this.gameCamera || !this.uiCamera || this.gameCamera.orthoHeight <= 0) {
            this.gameToUICameraScale = 1;
            return;
        }

        this.gameToUICameraScale = this.uiCamera.orthoHeight / this.gameCamera.orthoHeight;
    }

    initData() {
        /**清除数据 */
        this.clearData();

        this.rockerTouchNode.active = !this.isEnemyMode;
        this.slideTouchNode.active = this.isEnemyMode;
        this.monetaryNode.active = !this.isEnemyMode;
        this.refreshMonetaryLab();

        this.initMapLayer();
        this.getMapObjectLayer();

        this.initEnemyModeRobotDifficultyTypes();

        this.initRobot();
        this.initPlayer();
        this.showGuidePath();
        this.initRoleBtnList();

        this.initEnemy();
        this.refreshSkillNode();

        this.startGameCountDown();

        //等待随机时间后，机器人开始房间寻找
        this.startRobotSuchRoomDelays();
    }

    clearData() {
        this.unscheduleAllCallbacks();
        this.isCameraLockedBySaw = false;
        this.gameCameraComp?.unlockCameraPos();
        this.rockerTouchNode.active = false;
        this.slideTouchNode.active = false;
        this.oprateBtn.active = false;
        this.refreshBedGuideVisible(false);
        this.hasReportedEnterBedGuideStart = false;
        this.hasReportedEnterBedGuideFinish = false;
        this.closeTouchSelect();
        this.timeNode.active = false;
        this.repairBtn.active = false;
        this.isGameStartCountDownEnd = false;
        this.isGamePause = false;
        this.repairCoolDownTime = 0;
        this.skillCoolDownTimes = [];
        this.refreshSkillNode();
        this.isRoleDisappearPlaying = false;
        this.robotSuchRoomDelayMap.clear();
        this.playerLastRoomIdx = 0;
        this.pendingDoorBlockPosMap = {};
        this.doorAttackerCountMap = {};
        this.gameStartElapsedTime = 0;
        this.attackedRoomSet.clear();
        this.roleBtnStateRefreshTimer = ROLE_BUTTON_STATE_REFRESH_INTERVAL;
        Tween.stopAllByTarget(this.repairMask);
        this.repairMask.fillRange = 0;
        this.repairMask.node.active = false;

        this.stopGameCountDown();

        this.currentGuideTask = guideTaskType.none;
        this.pendingGuideTaskQueue = [];
        this.clearGuideDoorClickNode();
        this.isGuideDoorUpgradeReady = false;
        this.isGuideDoorUpgradeComplete = false;
        this.isGuideDoorUpgradeUIOpen = false;
        this.clearGuideBedClickNode();
        this.isGuideBedUpgradeReady = false;
        this.isGuideBedUpgradeComplete = false;
        this.isGuideBedUpgradeUIOpen = false;
        this.clearGuideGeneratorBuildClickNode();
        this.guideGeneratorBuildTilePos = null;
        this.isGuideGeneratorBuildReady = false;
        this.isGuideGeneratorBuildComplete = false;
        this.isGuideGeneratorBuildUIOpen = false;
        this.clearGuideCannonBuildClickNode();
        this.guideCannonBuildTilePos = null;
        this.hasGuidePlayerDoorBeenAttacked = false;
        this.isGuideCannonBuildReady = false;
        this.isGuideCannonBuildComplete = false;
        this.isGuideCannonBuildUIOpen = false;
        this.recycleAllTileItems();
        this.recycleGameBottomUINodeChildren();
        this.guideArrowNodeMap = {};
        this.recycleGameUINodeChildren();
        ccTools.destroyAllChild(this.roleNode);
        ccTools.destroyAllChild(this.roleBtnLayout);

        playerMgr.player = null;
        this.controlledEnemy = null;
        this.isEnemyModeGameOver = false;
        this.isEnemyCameraFollowing = false;
        this.enemyModeRobotDifficultyTypes = [];
        enemyMgr.enemyArr = [];
        enemyMgr.enemyId = 0;
        enemyMgr.enemyBornPosArr = [];
        this.robotArr = [];
        this.roomMap = {};
        // 护盾计时保存在静态字段中，需要在局间显式清理
        coverProps.clearShieldTimers();
        this.roleBtnStateMap = {};
        this.bornPosArr = [];
        this.randomPropsPosArr = [];
        this.clearCarriedRandomProps();
        this.tileMap = [];
        this.rockerReset();
    }

    /**回收全部瓦片节点 */
    private recycleAllTileItems() {
        for (let i = this.tileObjList.children.length - 1; i >= 0; i--) {
            let tileNode = this.tileObjList.children[i];
            let tileComp = tileNode.getComponent(tileItemController);
            if (tileComp) {
                tileComp.recycleToPool();
            } else {
                tileNode.removeFromParent();
                tileNode.destroy();
            }
        }
    }

    /**回收底层游戏UI节点中的运行时效果 */
    private recycleGameBottomUINodeChildren() {
        if (!this.gameBottomUINode) {
            return;
        }

        for (let i = this.gameBottomUINode.children.length - 1; i >= 0; i--) {
            let child = this.gameBottomUINode.children[i];
            if (child.getComponent(gameAnimController)) {
                poolMgr.putGameAnimNode(child);
            } else {
                poolMgr.putGameSpineNode(child);
            }
        }
    }

    /**回收游戏UI节点中的运行时效果 */
    private recycleGameUINodeChildren() {
        if (!this.gameUINode) {
            return;
        }

        for (let i = this.gameUINode.children.length - 1; i >= 0; i--) {
            let child = this.gameUINode.children[i];
            if (child.getComponent(produceTips)) {
                poolMgr.putProduceTipsNode(child);
            } else if (child.getComponent(bulletController)) {
                poolMgr.putBulletNode(child);
            } else if (child.getComponent(cageController) || child.getComponent(netController) || child.getComponent(sawController)) {
                poolMgr.putGameSpriteNode(child);
            } else if (child.getComponent(gameAnimController)) {
                poolMgr.putGameAnimNode(child);
            } else {
                child.removeFromParent();
                child.destroy();
            }
        }
    }

    /**添加底层游戏UI节点，并把世界坐标转换为节点本地坐标 */
    addGameBottomUINodeChild(node: Node, worldPos: Vec3) {
        if (!this.gameBottomUINode || !node || !node.isValid || !worldPos) {
            return false;
        }

        node.layer = this.gameBottomUINode.layer;
        this.gameBottomUINode.addChild(node);
        let localPos = this.gameBottomUINode.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        node.setPosition(localPos);
        return true;
    }

    /**初始化地图图块层数据 */
    initMapLayer() {
        pData.mapSize = this.tiledMap.getMapSize();
        pData.mapHalfSize = new Vec2((pData.mapSize.width * configData.tileSize) / 2, (pData.mapSize.height * configData.tileSize) / 2);

        // 初始化障碍物地图
        this.tileMap = Array.from(
            { length: pData.mapSize.width },
            () => Array.from(
                { length: pData.mapSize.height },
                () => ({ block: 0 })
            )
        );

        let mapLayer = this.tiledMap.getLayer("map");

        for (let i = 0; i < pData.mapSize.width; i++) {
            for (let j = 0; j < pData.mapSize.height; j++) {
                let gid = mapLayer.getTileGIDAt(i, j);

                let tileSet = this.tiledMap.getPropertiesForGID(gid);
                if (tileSet && tileSet["block"]) {
                    this.tileMap[i][j].block = 1;
                }
            }
        }
    }

    /**获取地图对象层数据 */
    getMapObjectLayer() {
        let objGroupData: TiledObjectGroup = this.tiledMap.getObjectGroup("obj");
        let objList = objGroupData.getObjects();
        // console.warn("----------->地图对象层数据：\n", objList);
        for (let i = 0; i < objList.length; i++) {
            let objItem = objList[i];

            //通用属性
            if (objItem.properties) {
                let tilePos = ccTools.getTileIndexByPos(objItem.offset.x, objItem.offset.y);

                let propsProperties: any = objItem.properties;
                if (propsProperties["born"] == true) {
                    this.bornPosArr.push(tilePos);
                }

                if (propsProperties["monsterBorn"] == true) {
                    enemyMgr.enemyBornPosArr.push(tilePos);
                }

                if (propsProperties["randomProps"] == true) {
                    this.randomPropsPosArr.push(tilePos);
                }
            }
        }
        this.createEnemyBornBloodEffects();
        // console.warn("随机道具点位", this.randomPropsPosArr);

        //处理房间数据
        let roomIdx = 1;
        while (true) {
            let roomObjData: TiledObjectGroup = this.tiledMap.getObjectGroup("room" + roomIdx);
            if (!roomObjData) {
                break;
            }

            //单房间数据
            let roomArr = [];
            //门数据
            let doorPos = null;
            //床数据
            let bedPos = null;
            let roomTileList = roomObjData.getObjects();

            for (let i = 0; i < roomTileList.length; i++) {
                let tileObjItem = roomTileList[i];
                let tilePos = ccTools.getTileIndexByPos(tileObjItem.offset.x, tileObjItem.offset.y);
                roomArr.push(tilePos);
                this.tileMap[tilePos.x][tilePos.y].roomIdx = roomIdx;

                if (tileObjItem.name) {
                    let nameData = ccTools.getNameData(tileObjItem.name);
                    let str = nameData[0];

                    let createItem = () => {
                        let tilePos = ccTools.getTileIndexByPos(tileObjItem.offset.x, tileObjItem.offset.y);
                        let tileItem = poolMgr.getTileItem(this.tileItemPre);
                        this.tileObjList.addChild(tileItem);
                        let tileComp: tileItemController = tileItem.getComponent(tileItemController);
                        tileItem.position = ccTools.getPosByTileIndex(tilePos);
                        tileComp.roomIdx = Number(roomIdx);
                        tileComp.pos = tilePos;
                        tileComp.bindGameComp(this);
                        this.tileMap[tilePos.x][tilePos.y].item = tileComp;
                        return tileComp;
                    }

                    if (str == "door") {
                        let tileComp = createItem();
                        tileComp.addProps(tilePropsType.door);

                        //处理门的数据
                        let dir = 0;
                        let offsetDir = 0;
                        if (tileObjItem.properties) {
                            if (tileObjItem.properties["direction"]) {
                                dir = Number(tileObjItem.properties["direction"]);
                            }

                            if (tileObjItem.properties["offset"]) {
                                offsetDir = Number(tileObjItem.properties["offset"]);
                            }
                        }
                        doorPos = tileComp.pos;
                        tileComp.setDoorPos(offsetDir, dir);

                    } else if (str == "bed") {
                        let tileComp = createItem();
                        this.tileMap[tileComp.pos.x][tileComp.pos.y].block = 1;
                        bedPos = tileComp.pos;
                        tileComp.addProps(tilePropsType.bed);
                    }
                }
            }

            this.roomMap[roomIdx] = {
                roomArr: roomArr,
                doorPos: doorPos,
                bedPos: bedPos,
            }
            roomIdx++;
        }
        // console.warn("房间数据", this.roomMap);
        this.createRandomPropsByMapPoint();
        this.createRandomPropsAroundRoomBed();
    }

    /**初始化玩家 */
    initPlayer() {
        playerMgr.player = instantiate(this.rolePre);
        this.roleNode.addChild(playerMgr.player);
        playerMgr.cameraFollow = !this.isEnemyMode;
        this.initRolePos(playerMgr.player);
        if (this.isEnemyMode) {
            // 复用原玩家节点作为第六个机器人，兼容房间和道具系统对 playerMgr 的引用。
            let robotIndex = this.robotArr.length;
            playerMgr.playerComp.init(
                this,
                robotIndex + 1,
                this.matchRoleSkinIds[robotIndex],
                this.matchRoleNicknames[robotIndex],
                this.enemyModeRobotDifficultyTypes[robotIndex],
            );
            this.robotArr.push(playerMgr.playerComp);
            return;
        }
        playerMgr.playerComp.init(this, 0, pData.skinId);
        this.playerLastRoomIdx = this.getRoomIdxByTilePos(playerMgr.playerComp.currentPos);
    }

    /**引导关内判断指定房间是否为引导房间 */
    isGuideRoom(roomIdx: number) {
        return pData.isGuide && roomIdx == GUIDE_ROOM_IDX;
    }

    /**显示玩家出生点到引导房间床位之间的路径箭头 */
    private showGuidePath() {
        if (!pData.isGuide || !this.gameBottomUINode || !uiMgr.gameAnimItemPrefab || !uiMgr.guideArrowAnimClip) {
            return;
        }

        let startPos = playerMgr.playerComp?.currentPos;
        let bedPos: Vec2 = this.roomMap[GUIDE_ROOM_IDX]?.bedPos;
        let width = Math.floor(pData.mapSize?.width || 0);
        let height = Math.floor(pData.mapSize?.height || 0);
        if (!startPos || !bedPos || width <= 0 || height <= 0) {
            console.warn("引导路径数据不完整，无法显示引导箭头");
            return;
        }

        let path = ccTools.findGridPath(
            width,
            height,
            startPos,
            bedPos,
            (x, y) => this.canGuidePathWalk(x, y, bedPos),
        );
        if (path.length == 0) {
            console.warn("玩家出生点无法寻路到引导房间床位");
            return;
        }

        if (!this.hasReportedEnterBedGuideStart) {
            if (gm.hgSdk) {
                gm.hgSdk.track('TUTORIAL_START', {});
            }
            this.hasReportedEnterBedGuideStart = true;
        }

        let previousPos = startPos;
        for (let i = 0; i < path.length - 1; i++) {
            let tilePos = path[i];
            this.createGuideArrow(tilePos, previousPos);
            previousPos = tilePos;
        }
    }

    /**引导路径可通行判断：门可经过，目标床位可到达 */
    private canGuidePathWalk(tileX: number, tileY: number, bedPos: Vec2) {
        if (tileX == bedPos.x && tileY == bedPos.y) {
            return true;
        }

        let tileData = this.tileMap[tileX]?.[tileY];
        if (!tileData) {
            return false;
        }

        if (tileData.item?.tileType == tilePropsType.door) {
            return true;
        }

        return tileData.block != 1;
    }

    /**在指定路径格创建朝向前进方向的循环箭头 */
    private createGuideArrow(tilePos: Vec2, previousPos: Vec2) {
        let arrowNode = poolMgr.getGameAnimNode(uiMgr.gameAnimItemPrefab);
        let animComp = arrowNode.getComponent(gameAnimController);
        if (!animComp) {
            poolMgr.putGameAnimNode(arrowNode);
            return;
        }

        this.gameBottomUINode.addChild(arrowNode);
        arrowNode.setPosition(ccTools.getPosByTileIndex(tilePos));
        arrowNode.setScale(0.1, 0.1, 0.1);
        let directionX = tilePos.x - previousPos.x;
        let directionY = previousPos.y - tilePos.y;
        arrowNode.angle = Math.atan2(directionY, directionX) * 180 / Math.PI;
        animComp.startAnim(uiMgr.guideArrowAnimClip);
        this.guideArrowNodeMap[this.getTilePosKey(tilePos)] = arrowNode;
    }

    /**回收玩家当前经过瓦片上的引导箭头 */
    private recycleGuideArrowByTilePos(tilePos: Vec2) {
        if (!tilePos) {
            return;
        }

        let key = this.getTilePosKey(tilePos);
        let arrowNode = this.guideArrowNodeMap[key];
        if (!arrowNode) {
            return;
        }

        delete this.guideArrowNodeMap[key];
        if (arrowNode.isValid) {
            poolMgr.putGameAnimNode(arrowNode);
        }
    }

    /**回收全部引导路径箭头 */
    private recycleAllGuideArrows() {
        let keys = Object.keys(this.guideArrowNodeMap);
        for (let i = 0; i < keys.length; i++) {
            let arrowNode = this.guideArrowNodeMap[keys[i]];
            if (arrowNode?.isValid) {
                poolMgr.putGameAnimNode(arrowNode);
            }
        }

        this.guideArrowNodeMap = {};
    }

    /**条件首次达成时入队；没有其他引导时立即显示 */
    private enqueueGuideTask(taskType: guideTaskType) {
        if (!pData.isGuide || taskType == guideTaskType.none || this.isGuideTaskComplete(taskType)
            || this.currentGuideTask == taskType || this.pendingGuideTaskQueue.indexOf(taskType) >= 0) {
            return;
        }

        if (this.currentGuideTask == guideTaskType.none) {
            this.currentGuideTask = taskType;
            this.showCurrentGuideTask();
            return;
        }

        this.pendingGuideTaskQueue.push(taskType);
    }

    /**完成或跳过指定引导，并按入队顺序显示下一项 */
    private finishGuideTask(taskType: guideTaskType) {
        let queueIdx = this.pendingGuideTaskQueue.indexOf(taskType);
        if (queueIdx >= 0) {
            this.pendingGuideTaskQueue.splice(queueIdx, 1);
        }

        if (this.currentGuideTask != taskType) {
            return;
        }

        if (gm.hgSdk) {
            gm.hgSdk.track('TUTORIAL_FINISH', {});
        }
        this.currentGuideTask = guideTaskType.none;
        while (this.pendingGuideTaskQueue.length > 0) {
            let nextTaskType = this.pendingGuideTaskQueue.shift();
            if (this.isGuideTaskComplete(nextTaskType)) {
                continue;
            }

            this.currentGuideTask = nextTaskType;
            this.showCurrentGuideTask();
            break;
        }
    }

    /**创建当前队首引导的场景点击手指 */
    private showCurrentGuideTask() {
        if (gm.hgSdk) {
            gm.hgSdk.track('TUTORIAL_START', {});
        }

        if (this.currentGuideTask == guideTaskType.doorUpgrade) {
            let roomIdx = playerMgr.playerComp?.roomIdx || 0;
            this.createGuideDoorClickNode(this.getDoorByRoom(roomIdx));
        } else if (this.currentGuideTask == guideTaskType.bedUpgrade) {
            let roomIdx = playerMgr.playerComp?.roomIdx || 0;
            let bedPos = this.roomMap[roomIdx]?.bedPos;
            let bedComp = this.tileMap[bedPos?.x]?.[bedPos?.y]?.item?.propsComp as bedProps;
            this.createGuideBedClickNode(bedComp);
        } else if (this.currentGuideTask == guideTaskType.cannonBuild) {
            this.createGuideCannonBuildClickNode();
        } else if (this.currentGuideTask == guideTaskType.generatorBuild) {
            this.createGuideGeneratorBuildClickNode();
        }
    }

    /**指定引导是否已完成或被跳过 */
    private isGuideTaskComplete(taskType: guideTaskType) {
        if (taskType == guideTaskType.doorUpgrade) {
            return this.isGuideDoorUpgradeComplete;
        }
        if (taskType == guideTaskType.bedUpgrade) {
            return this.isGuideBedUpgradeComplete;
        }
        if (taskType == guideTaskType.cannonBuild) {
            return this.isGuideCannonBuildComplete;
        }
        if (taskType == guideTaskType.generatorBuild) {
            return this.isGuideGeneratorBuildComplete;
        }

        return true;
    }

    /**当前道具是否为引导关玩家房间的门 */
    private isPlayerGuideDoor(doorComp: doorProps) {
        let roomIdx = playerMgr.playerComp?.roomIdx || 0;
        return !!doorComp
            && this.isGuideRoom(roomIdx)
            && this.getDoorByRoom(roomIdx) == doorComp;
    }

    /**门升级界面是否需要显示首次升级点击引导 */
    shouldShowGuideDoorUpgrade(doorComp: doorProps) {
        return pData.isGuide
            && this.currentGuideTask == guideTaskType.doorUpgrade
            && this.isGuideDoorUpgradeReady
            && !this.isGuideDoorUpgradeComplete
            && this.canAffordGuideUpgrade(doorComp)
            && this.isPlayerGuideDoor(doorComp);
    }

    /**首次升级玩家引导房间的门后结束本阶段引导 */
    completeGuideDoorUpgrade(doorComp: doorProps) {
        if (!pData.isGuide || !this.isPlayerGuideDoor(doorComp)) {
            return;
        }

        if (!this.isGuideDoorUpgradeComplete) {
            this.isGuideDoorUpgradeComplete = true;
            this.isGuideDoorUpgradeReady = false;
            this.isGuideDoorUpgradeUIOpen = false;
            this.clearGuideDoorClickNode();
            this.finishGuideTask(guideTaskType.doorUpgrade);
            this.scheduleOnce(this.refreshGuideUpgradeGuide, 0);
        }

        this.scheduleOnce(this.refreshGuideGeneratorBuildGuide, 0);
    }

    /**金币足够升级门时，在玩家房门上显示点击手指 */
    private refreshGuideDoorUpgradeGuide() {
        if (!pData.isGuide || this.isGuideDoorUpgradeComplete
            || playerMgr.playerComp?.state != roleState.bed) {
            return;
        }

        let roomIdx = playerMgr.playerComp.roomIdx;
        if (!this.isGuideRoom(roomIdx)) {
            return;
        }

        let doorComp = this.getDoorByRoom(roomIdx);
        let nextPropsData = doorComp?.propsDatas?.[doorComp.level + 1];
        if (!doorComp || !nextPropsData || !doorComp.checkCanUpgrade(nextPropsData)) {
            if (this.currentGuideTask == guideTaskType.doorUpgrade) {
                this.clearGuideDoorClickNode();
            }
            return;
        }

        if (this.isGuideDoorUpgradeReady) {
            if (this.currentGuideTask == guideTaskType.doorUpgrade && !this.isGuideDoorUpgradeUIOpen
                && !this.guideDoorClickNode?.isValid) {
                this.createGuideDoorClickNode(doorComp);
            }
            return;
        }

        this.isGuideDoorUpgradeReady = true;
        this.enqueueGuideTask(guideTaskType.doorUpgrade);
    }

    /**在游戏道具层创建门点击手指 */
    private async createGuideDoorClickNode(doorComp: doorProps) {
        this.clearGuideDoorClickNode();
        if (!this.shouldShowGuideDoorUpgrade(doorComp) || this.isGuideDoorUpgradeUIOpen
            || !uiMgr.gameSpineItemPrefab || !this.gameBottomUINode) {
            return;
        }

        let clickNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.guideDoorClickNode = clickNode;
        clickNode.name = "guideDoorClick";
        if (!this.addGuideClickNodeToGameBottom(clickNode, doorComp.pos, 20, 0)) {
            this.clearGuideDoorClickNode();
            return;
        }
        clickNode.setScale(0.85, 0.85, 1);

        let skeleton = poolMgr.getGameNodeSkeleton(clickNode);
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.click);
        if (!isLoaded || clickNode != this.guideDoorClickNode || !this.shouldShowGuideDoorUpgrade(doorComp)
            || this.isGuideDoorUpgradeUIOpen) {
            if (clickNode == this.guideDoorClickNode) {
                this.clearGuideDoorClickNode();
            }
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**清理门上的点击手指 */
    private clearGuideDoorClickNode() {
        if (this.guideDoorClickNode?.isValid) {
            poolMgr.putGameSpineNode(this.guideDoorClickNode);
        }

        this.guideDoorClickNode = null;
    }

    /**当前道具是否为引导关玩家使用的床 */
    private isPlayerGuideBed(bedComp: bedProps) {
        let roomIdx = playerMgr.playerComp?.roomIdx || 0;
        let bedPos = this.roomMap[roomIdx]?.bedPos;
        return !!bedComp
            && this.isGuideRoom(roomIdx)
            && this.tileMap[bedPos?.x]?.[bedPos?.y]?.item?.propsComp == bedComp;
    }

    /**床升级界面是否需要显示首次升级点击引导 */
    shouldShowGuideBedUpgrade(bedComp: bedProps) {
        return pData.isGuide
            && this.currentGuideTask == guideTaskType.bedUpgrade
            && this.isGuideDoorUpgradeComplete
            && this.isGuideBedUpgradeReady
            && !this.isGuideBedUpgradeComplete
            && this.canAffordGuideUpgrade(bedComp)
            && this.isPlayerGuideBed(bedComp);
    }

    /**首次升级床后结束本阶段引导；门升级前已升级床也会据此跳过 */
    completeGuideBedUpgrade(bedComp: bedProps) {
        if (!pData.isGuide || this.isGuideBedUpgradeComplete || !this.isPlayerGuideBed(bedComp)) {
            return;
        }

        this.isGuideBedUpgradeComplete = true;
        this.isGuideBedUpgradeReady = false;
        this.isGuideBedUpgradeUIOpen = false;
        this.clearGuideBedClickNode();
        this.finishGuideTask(guideTaskType.bedUpgrade);
    }

    /**门升级完成后，金币足够升级床时显示点击手指 */
    private refreshGuideBedUpgradeGuide() {
        if (!pData.isGuide || !this.isGuideDoorUpgradeComplete
            || this.isGuideBedUpgradeComplete || playerMgr.playerComp?.state != roleState.bed) {
            return;
        }

        let roomIdx = playerMgr.playerComp.roomIdx;
        if (!this.isGuideRoom(roomIdx)) {
            return;
        }

        let bedPos = this.roomMap[roomIdx]?.bedPos;
        let bedComp = this.tileMap[bedPos?.x]?.[bedPos?.y]?.item?.propsComp as bedProps;
        if (!bedComp) {
            return;
        }

        if (bedComp.level > 0) {
            this.isGuideBedUpgradeComplete = true;
            this.finishGuideTask(guideTaskType.bedUpgrade);
            return;
        }

        let nextPropsData = bedComp.propsDatas?.[bedComp.level + 1];
        if (!nextPropsData || !bedComp.checkCanUpgrade(nextPropsData)) {
            if (this.currentGuideTask == guideTaskType.bedUpgrade) {
                this.clearGuideBedClickNode();
            }
            return;
        }

        if (this.isGuideBedUpgradeReady) {
            if (this.currentGuideTask == guideTaskType.bedUpgrade && !this.isGuideBedUpgradeUIOpen
                && !this.guideBedClickNode?.isValid) {
                this.createGuideBedClickNode(bedComp);
            }
            return;
        }

        this.isGuideBedUpgradeReady = true;
        this.enqueueGuideTask(guideTaskType.bedUpgrade);
    }

    /**在游戏道具层创建床点击手指 */
    private async createGuideBedClickNode(bedComp: bedProps) {
        this.clearGuideBedClickNode();
        if (!this.shouldShowGuideBedUpgrade(bedComp) || this.isGuideBedUpgradeUIOpen
            || !uiMgr.gameSpineItemPrefab || !this.gameBottomUINode) {
            return;
        }

        let clickNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.guideBedClickNode = clickNode;
        clickNode.name = "guideBedClick";
        if (!this.addGuideClickNodeToGameBottom(clickNode, bedComp.pos, 20, 0)) {
            this.clearGuideBedClickNode();
            return;
        }
        clickNode.setScale(0.85, 0.85, 1);

        let skeleton = poolMgr.getGameNodeSkeleton(clickNode);
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.click);
        if (!isLoaded || clickNode != this.guideBedClickNode || !this.shouldShowGuideBedUpgrade(bedComp)
            || this.isGuideBedUpgradeUIOpen) {
            if (clickNode == this.guideBedClickNode) {
                this.clearGuideBedClickNode();
            }
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**清理床上的点击手指 */
    private clearGuideBedClickNode() {
        if (this.guideBedClickNode?.isValid) {
            poolMgr.putGameSpineNode(this.guideBedClickNode);
        }

        this.guideBedClickNode = null;
    }

    /**当前是否满足指定门或床的全部升级条件 */
    private canAffordGuideUpgrade(propsComp: doorProps | bedProps) {
        let nextPropsData = propsComp?.propsDatas?.[propsComp.level + 1];
        return !!nextPropsData && propsComp.checkCanUpgrade(nextPropsData);
    }

    /**按门、床顺序刷新当前升级引导阶段 */
    private refreshGuideUpgradeGuide() {
        if (!pData.isGuide) {
            return;
        }

        if (!this.isGuideDoorUpgradeComplete) {
            this.refreshGuideDoorUpgradeGuide();
            return;
        }

        if (!this.isGuideBedUpgradeComplete) {
            this.refreshGuideBedUpgradeGuide();
        }
    }

    /**打开门或床升级界面时隐藏对应的场景手指 */
    onGuideUpgradeUIOpened(propsComp: doorProps | bedProps) {
        let propsType = propsComp?.tileItemComp?.tileType;
        if (propsType == tilePropsType.door) {
            let doorComp = propsComp as doorProps;
            if (!this.shouldShowGuideDoorUpgrade(doorComp)) {
                return;
            }

            this.isGuideDoorUpgradeUIOpen = true;
            this.clearGuideDoorClickNode();
        } else if (propsType == tilePropsType.bed) {
            let bedComp = propsComp as bedProps;
            if (!this.shouldShowGuideBedUpgrade(bedComp)) {
                return;
            }

            this.isGuideBedUpgradeUIOpen = true;
            this.clearGuideBedClickNode();
        }
    }

    /**未升级便关闭门或床界面时恢复对应的场景手指 */
    onGuideUpgradeUIClosed(propsComp: doorProps | bedProps) {
        let propsType = propsComp?.tileItemComp?.tileType;
        if (propsType == tilePropsType.door && this.isGuideDoorUpgradeUIOpen) {
            this.isGuideDoorUpgradeUIOpen = false;
            let doorComp = propsComp as doorProps;
            if (this.shouldShowGuideDoorUpgrade(doorComp)) {
                this.createGuideDoorClickNode(doorComp);
            }
        } else if (propsType == tilePropsType.bed && this.isGuideBedUpgradeUIOpen) {
            this.isGuideBedUpgradeUIOpen = false;
            let bedComp = propsComp as bedProps;
            if (this.shouldShowGuideBedUpgrade(bedComp)) {
                this.createGuideBedClickNode(bedComp);
            }
        }
    }

    /**发电机建造界面是否仍处于引导状态 */
    shouldShowGuideGeneratorBuild() {
        return pData.isGuide
            && this.currentGuideTask == guideTaskType.generatorBuild
            && this.isGuideGeneratorBuildReady
            && !this.isGuideGeneratorBuildComplete;
    }

    /**打开引导中的建造界面时，隐藏游戏层空闲格手指 */
    onGuideGeneratorBuildUIOpened() {
        if (!this.shouldShowGuideGeneratorBuild()) {
            return;
        }

        this.isGuideGeneratorBuildUIOpen = true;
        this.clearGuideGeneratorBuildClickNode();
    }

    /**未完成购买便关闭建造界面时，恢复空闲格手指 */
    onGuideGeneratorBuildUIClosed() {
        if (!this.isGuideGeneratorBuildUIOpen) {
            return;
        }

        this.isGuideGeneratorBuildUIOpen = false;
        if (this.shouldShowGuideGeneratorBuild() && this.guideGeneratorBuildTilePos) {
            this.createGuideGeneratorBuildClickNode();
        }
    }

    /**成功购买首个引导发电机后结束本阶段引导 */
    completeGuideGeneratorBuild() {
        if (!pData.isGuide || !this.isGuideGeneratorBuildReady || this.isGuideGeneratorBuildComplete) {
            return;
        }

        this.isGuideGeneratorBuildComplete = true;
        this.isGuideGeneratorBuildReady = false;
        this.isGuideGeneratorBuildUIOpen = false;
        this.guideGeneratorBuildTilePos = null;
        this.clearGuideGeneratorBuildClickNode();
        this.finishGuideTask(guideTaskType.generatorBuild);
    }

    /**门达到6级且金币达到200时，引导在床边空闲格建造发电机 */
    private refreshGuideGeneratorBuildGuide() {
        if (!pData.isGuide || this.isGuideGeneratorBuildReady || this.isGuideGeneratorBuildComplete
            || playerMgr.playerComp?.state != roleState.bed || pData.gameCoin < 200) {
            return;
        }

        let roomIdx = playerMgr.playerComp.roomIdx;
        if (!this.isGuideRoom(roomIdx)) {
            return;
        }

        let doorComp = this.getDoorByRoom(roomIdx);
        if (!doorComp || doorComp.level + 1 < 6) {
            return;
        }

        let roomData: roomData = this.roomMap[roomIdx];
        if (this.hasRoomPropsByType(roomData, tilePropsType.generator)) {
            this.isGuideGeneratorBuildComplete = true;
            this.finishGuideTask(guideTaskType.generatorBuild);
            return;
        }

        let emptyPos = this.getGuideEmptyPosNearestTo(roomData, roomData.bedPos, this.guideCannonBuildTilePos);
        if (!emptyPos) {
            return;
        }

        this.guideGeneratorBuildTilePos = new Vec2(emptyPos.x, emptyPos.y);
        this.isGuideGeneratorBuildReady = true;
        this.enqueueGuideTask(guideTaskType.generatorBuild);
    }

    /**在床边最近空闲格中心创建发电机建造点击手指 */
    private async createGuideGeneratorBuildClickNode() {
        this.clearGuideGeneratorBuildClickNode();
        if (!this.shouldShowGuideGeneratorBuild() || this.isGuideGeneratorBuildUIOpen
            || !this.guideGeneratorBuildTilePos || !uiMgr.gameSpineItemPrefab || !this.gameBottomUINode) {
            return;
        }

        let clickNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.guideGeneratorBuildClickNode = clickNode;
        clickNode.name = "guideGeneratorBuildClick";
        if (!this.addGuideClickNodeToGameBottom(clickNode, this.guideGeneratorBuildTilePos)) {
            this.clearGuideGeneratorBuildClickNode();
            return;
        }
        clickNode.setScale(0.85, 0.85, 1);

        let skeleton = poolMgr.getGameNodeSkeleton(clickNode);
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.click);
        if (!isLoaded || clickNode != this.guideGeneratorBuildClickNode
            || !this.shouldShowGuideGeneratorBuild() || this.isGuideGeneratorBuildUIOpen) {
            if (clickNode == this.guideGeneratorBuildClickNode) {
                this.clearGuideGeneratorBuildClickNode();
            }
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**将游戏层手指统一放到gameBottomUINode，并定位到瓦片中心 */
    private addGuideClickNodeToGameBottom(clickNode: Node, tilePos: Vec2, offsetX = 0, offsetY = 0) {
        if (!clickNode || !tilePos || !this.gameBottomUINode) {
            return false;
        }

        this.getTileCenterWorldPos(tilePos, this.tempTileCenterWorldPos);
        clickNode.layer = this.gameBottomUINode.layer;
        if (!this.addGameBottomUINodeChild(clickNode, this.tempTileCenterWorldPos)) {
            return false;
        }

        clickNode.setPosition(clickNode.position.x + offsetX, clickNode.position.y + offsetY, clickNode.position.z);
        return true;
    }

    /**清理空闲格上的发电机建造点击手指 */
    private clearGuideGeneratorBuildClickNode() {
        if (this.guideGeneratorBuildClickNode?.isValid) {
            poolMgr.putGameSpineNode(this.guideGeneratorBuildClickNode);
        }

        this.guideGeneratorBuildClickNode = null;
    }

    /**指定类型建筑是否处于首次建造引导 */
    shouldShowGuideBuild(propsType: tilePropsType) {
        if (propsType == tilePropsType.generator) {
            return this.shouldShowGuideGeneratorBuild();
        }

        if (propsType == tilePropsType.cannon) {
            return this.shouldShowGuideCannonBuild();
        }

        return false;
    }

    /**获取当前需要在建造界面引导购买的建筑类型 */
    private getGuideBuildPropsType(tilePos: Vec2) {
        let showCannonGuide = this.shouldShowGuideCannonBuild();
        let showGeneratorGuide = this.shouldShowGuideGeneratorBuild();
        if (!showCannonGuide) {
            return showGeneratorGuide ? tilePropsType.generator : tilePropsType.none;
        }
        if (!showGeneratorGuide) {
            return tilePropsType.cannon;
        }

        if (this.isSameTilePos(tilePos, this.guideCannonBuildTilePos)) {
            return tilePropsType.cannon;
        }
        if (this.isSameTilePos(tilePos, this.guideGeneratorBuildTilePos)) {
            return tilePropsType.generator;
        }

        let cannonDistanceSqr = this.getTileDistanceSqr(tilePos, this.guideCannonBuildTilePos);
        let generatorDistanceSqr = this.getTileDistanceSqr(tilePos, this.guideGeneratorBuildTilePos);
        return cannonDistanceSqr <= generatorDistanceSqr ? tilePropsType.cannon : tilePropsType.generator;
    }

    /**获取两个瓦片坐标之间的距离平方 */
    private getTileDistanceSqr(posA: Vec2, posB: Vec2) {
        if (!posA || !posB) {
            return Number.MAX_VALUE;
        }

        let offsetX = posA.x - posB.x;
        let offsetY = posA.y - posB.y;
        return offsetX * offsetX + offsetY * offsetY;
    }

    /**打开指定建筑的引导建造界面 */
    onGuideBuildUIOpened(propsType: tilePropsType) {
        if (propsType == tilePropsType.generator) {
            this.onGuideGeneratorBuildUIOpened();
        } else if (propsType == tilePropsType.cannon) {
            this.onGuideCannonBuildUIOpened();
        }
    }

    /**关闭指定建筑的引导建造界面 */
    onGuideBuildUIClosed(propsType: tilePropsType) {
        if (propsType == tilePropsType.generator) {
            this.onGuideGeneratorBuildUIClosed();
        } else if (propsType == tilePropsType.cannon) {
            this.onGuideCannonBuildUIClosed();
        }
    }

    /**完成指定建筑的首次建造引导 */
    completeGuideBuild(propsType: tilePropsType) {
        if (propsType == tilePropsType.generator) {
            this.completeGuideGeneratorBuild();
        } else if (propsType == tilePropsType.cannon) {
            this.completeGuideCannonBuild();
        }
    }

    /**炮台建造界面是否仍处于引导状态 */
    private shouldShowGuideCannonBuild() {
        return pData.isGuide
            && this.currentGuideTask == guideTaskType.cannonBuild
            && this.isGuideCannonBuildReady
            && !this.isGuideCannonBuildComplete;
    }

    /**打开引导中的建造界面时，隐藏游戏层炮台空闲格手指 */
    private onGuideCannonBuildUIOpened() {
        if (!this.shouldShowGuideCannonBuild()) {
            return;
        }

        this.isGuideCannonBuildUIOpen = true;
        this.clearGuideCannonBuildClickNode();
    }

    /**未完成购买便关闭建造界面时，恢复炮台空闲格手指 */
    private onGuideCannonBuildUIClosed() {
        if (!this.isGuideCannonBuildUIOpen) {
            return;
        }

        this.isGuideCannonBuildUIOpen = false;
        if (this.shouldShowGuideCannonBuild() && this.guideCannonBuildTilePos) {
            this.createGuideCannonBuildClickNode();
        }
    }

    /**成功购买首个引导炮台后结束本阶段引导 */
    private completeGuideCannonBuild() {
        if (!pData.isGuide || !this.isGuideCannonBuildReady || this.isGuideCannonBuildComplete) {
            return;
        }

        this.isGuideCannonBuildComplete = true;
        this.isGuideCannonBuildReady = false;
        this.isGuideCannonBuildUIOpen = false;
        this.guideCannonBuildTilePos = null;
        this.clearGuideCannonBuildClickNode();
        this.finishGuideTask(guideTaskType.cannonBuild);
    }

    /**记录玩家引导房门首次受到Boss实际伤害 */
    private onGuidePlayerDoorAttacked(tilePos: Vec2) {
        if (!pData.isGuide || this.hasGuidePlayerDoorBeenAttacked || !tilePos) {
            return;
        }

        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        let doorComp = this.getDoorByRoom(roomIdx);
        if (!this.isGuideRoom(roomIdx) || !doorComp || !this.isSameTilePos(doorComp.pos, tilePos)) {
            return;
        }

        this.hasGuidePlayerDoorBeenAttacked = true;
        this.refreshGuideCannonBuildGuide();
    }

    /**玩家房门被Boss攻击且金币达到8时，引导在门边建造炮台 */
    private refreshGuideCannonBuildGuide() {
        if (!pData.isGuide || !this.hasGuidePlayerDoorBeenAttacked || this.isGuideCannonBuildReady
            || this.isGuideCannonBuildComplete
            || playerMgr.playerComp?.state != roleState.bed || pData.gameCoin < 8) {
            return;
        }

        let roomIdx = playerMgr.playerComp.roomIdx;
        if (!this.isGuideRoom(roomIdx)) {
            return;
        }

        let roomData: roomData = this.roomMap[roomIdx];
        if (this.hasRoomPropsByType(roomData, tilePropsType.cannon)) {
            this.isGuideCannonBuildComplete = true;
            this.finishGuideTask(guideTaskType.cannonBuild);
            return;
        }

        let emptyPos = this.getGuideEmptyPosNearestTo(roomData, roomData.doorPos, this.guideGeneratorBuildTilePos);
        if (!emptyPos) {
            return;
        }

        this.guideCannonBuildTilePos = new Vec2(emptyPos.x, emptyPos.y);
        this.isGuideCannonBuildReady = true;
        this.enqueueGuideTask(guideTaskType.cannonBuild);
    }

    /**在离门最近的空闲格中心创建炮台建造点击手指 */
    private async createGuideCannonBuildClickNode() {
        this.clearGuideCannonBuildClickNode();
        if (!this.shouldShowGuideCannonBuild() || this.isGuideCannonBuildUIOpen
            || !this.guideCannonBuildTilePos || !uiMgr.gameSpineItemPrefab || !this.gameBottomUINode) {
            return;
        }

        let clickNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
        this.guideCannonBuildClickNode = clickNode;
        clickNode.name = "guideCannonBuildClick";
        if (!this.addGuideClickNodeToGameBottom(clickNode, this.guideCannonBuildTilePos)) {
            this.clearGuideCannonBuildClickNode();
            return;
        }
        clickNode.setScale(0.85, 0.85, 1);

        let skeleton = poolMgr.getGameNodeSkeleton(clickNode);
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.click);
        if (!isLoaded || clickNode != this.guideCannonBuildClickNode
            || !this.shouldShowGuideCannonBuild() || this.isGuideCannonBuildUIOpen) {
            if (clickNode == this.guideCannonBuildClickNode) {
                this.clearGuideCannonBuildClickNode();
            }
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**提示格被其他建筑占用后，为仍未完成的建造引导重新选择空闲格 */
    private refreshGuideBuildTilePosAfterCreate(occupiedPos: Vec2) {
        if (!pData.isGuide || !occupiedPos) {
            return;
        }

        let roomIdx = playerMgr.playerComp?.roomIdx || 0;
        let roomData: roomData = this.roomMap[roomIdx];
        if (!this.isGuideRoom(roomIdx) || !roomData) {
            return;
        }

        if (this.isGuideCannonBuildReady && !this.isGuideCannonBuildComplete
            && this.isSameTilePos(occupiedPos, this.guideCannonBuildTilePos)) {
            this.clearGuideCannonBuildClickNode();
            let emptyPos = this.getGuideEmptyPosNearestTo(roomData, roomData.doorPos, this.guideGeneratorBuildTilePos);
            this.guideCannonBuildTilePos = emptyPos ? new Vec2(emptyPos.x, emptyPos.y) : null;
            if (this.shouldShowGuideCannonBuild() && this.guideCannonBuildTilePos && !this.isGuideCannonBuildUIOpen) {
                this.createGuideCannonBuildClickNode();
            }
        }

        if (this.isGuideGeneratorBuildReady && !this.isGuideGeneratorBuildComplete
            && this.isSameTilePos(occupiedPos, this.guideGeneratorBuildTilePos)) {
            this.clearGuideGeneratorBuildClickNode();
            let emptyPos = this.getGuideEmptyPosNearestTo(roomData, roomData.bedPos, this.guideCannonBuildTilePos);
            this.guideGeneratorBuildTilePos = emptyPos ? new Vec2(emptyPos.x, emptyPos.y) : null;
            if (this.shouldShowGuideGeneratorBuild() && this.guideGeneratorBuildTilePos && !this.isGuideGeneratorBuildUIOpen) {
                this.createGuideGeneratorBuildClickNode();
            }
        }
    }

    /**清理空闲格上的炮台建造点击手指 */
    private clearGuideCannonBuildClickNode() {
        if (this.guideCannonBuildClickNode?.isValid) {
            poolMgr.putGameSpineNode(this.guideCannonBuildClickNode);
        }

        this.guideCannonBuildClickNode = null;
    }

    /**初始化机器人 */
    initRobot() {
        for (let i = 0; i < 5; i++) {
            let robot = instantiate(this.rolePre);
            this.roleNode.addChild(robot);
            let robotComp: roleController = robot.getComponent(roleController);
            this.robotArr.push(robotComp);
            this.initRolePos(robot);
            let skinId = this.matchRoleSkinIds[i];
            robotComp.init(this, i + 1, skinId, this.matchRoleNicknames[i], this.enemyModeRobotDifficultyTypes[i]);
        }
    }

    /**在所有敌人出生点创建常驻回血动画 */
    private createEnemyBornBloodEffects() {
        if (!uiMgr.gameSpineItemPrefab || !this.gameBottomUINode) {
            return;
        }

        let bornPosArr = enemyMgr.enemyBornPosArr || [];
        for (let i = 0; i < bornPosArr.length; i++) {
            let bornPos = bornPosArr[i];
            let bloodNode = poolMgr.getGameSpineNode(uiMgr.gameSpineItemPrefab);
            bloodNode.name = "enemyBornBloodSpine";
            bloodNode.setScale(3, 3, 1);
            this.getTileCenterWorldPos(bornPos, this.tempTileCenterWorldPos);
            if (!this.addGameBottomUINodeChild(bloodNode, this.tempTileCenterWorldPos)) {
                poolMgr.putGameSpineNode(bloodNode);
                continue;
            }

            let skeleton = poolMgr.getGameNodeSkeleton(bloodNode);
            if (skeleton) {
                this.playEnemyBornBloodAnim(skeleton, bloodNode);
            }
        }
    }

    /**播放敌人出生点常驻回血动画 */
    private async playEnemyBornBloodAnim(skeleton: sp.Skeleton, node: Node) {
        let isLoaded = await ccTools.loadSpine(skeleton, spinePath.blood);
        if (!isLoaded || !skeleton || !skeleton.isValid || !node || !node.isValid
            || node.parent != this.gameBottomUINode || node.name != "enemyBornBloodSpine") {
            return;
        }

        skeleton.setAnimation(0, "animation", true);
    }

    /**敌人模式随机三种难度，并将每种难度各分配给两名机器人 */
    private initEnemyModeRobotDifficultyTypes() {
        this.enemyModeRobotDifficultyTypes = [];
        if (!this.isEnemyMode) {
            return;
        }

        let availableTypes = Array.from(new Set(pData.AIdifficultyTypes || []));
        ccTools.shuffleArray(availableTypes);
        let selectedTypes = availableTypes.slice(0, Math.min(3, availableTypes.length));
        for (let i = 0; i < selectedTypes.length; i++) {
            this.enemyModeRobotDifficultyTypes.push(selectedTypes[i], selectedTypes[i]);
        }
        ccTools.shuffleArray(this.enemyModeRobotDifficultyTypes);
    }

    /**初始化角色定位按钮 */
    initRoleBtnList() {
        if (!this.roleBtnLayout || !this.roleBtnPre) {
            return;
        }

        ccTools.destroyAllChild(this.roleBtnLayout);

        for (let i = 0; i < this.robotArr.length; i++) {
            this.createRoleBtn(this.robotArr[i]);
        }

        if (playerMgr.playerComp && !this.isEnemyMode) {
            this.createRoleBtn(playerMgr.playerComp);
        }
    }

    /**创建角色定位按钮 */
    createRoleBtn(roleComp: roleController) {
        if (!roleComp || !roleComp.node) {
            return;
        }

        let roleBtn = instantiate(this.roleBtnPre);
        this.roleBtnLayout.addChild(roleBtn);

        let avatar = roleBtn.getChildByName("mask").getChildByName("avatar").getComponent(Sprite);
        let nameLab = roleBtn.getChildByName("nameLab");
        if (nameLab) {
            if (this.isEnemyMode) {
                // 敌人模式中所有头像都是幸存者，不显示“自己”，改为显示各自的角色名称。
                nameLab.active = true;
                let nameLabel = nameLab.getComponent(Label);
                if (nameLabel) {
                    nameLabel.string = roleComp.roleNameLab?.string || `人机${roleComp.roleId}`;
                }
            } else {
                nameLab.active = playerMgr.playerComp?.roleId == roleComp.roleId;
            }
        }

        ccTools.loadImg(avatar, imgPath.roleAvatar + roleComp.skinId);
        this.initRoleBtnState(roleBtn, roleComp.roleId, avatar);

        let btnComp = roleBtn.getComponent(zoomButton);
        if (!btnComp) {
            btnComp = roleBtn.addComponent(zoomButton);
        }
        btnComp.onClick = this.clickRoleBtn.bind(this, roleComp.roleId);
    }

    /**初始化角色头像按钮状态 */
    private initRoleBtnState(roleBtn: Node, roleId: number, avatar: Sprite) {
        let attackNode = roleBtn.getChildByName("mask")?.getChildByName("attack");
        let redMask = roleBtn.getChildByName("redMask");
        let avatarNode = avatar?.node || roleBtn.getChildByName("mask")?.getChildByName("avatar");
        let redMaskOpacity = redMask ? (redMask.getComponent(UIOpacity) || redMask.addComponent(UIOpacity)) : null;

        let stateData: roleBtnStateData = {
            roleBtn: roleBtn,
            avatarNode: avatarNode,
            avatarSprite: avatar,
            attackNode: attackNode,
            redMaskOpacity: redMaskOpacity,
            isAttackAnimPlaying: false,
            needLoopAttackAnim: false,
            lastIsDead: null,
            lastIsRoomAttacked: null,
            baseAvatarPos: avatarNode ? avatarNode.position.clone() : new Vec3(),
        };
        this.roleBtnStateMap[roleId] = stateData;
        this.resetRoleBtnState(stateData, true);
    }

    /**刷新角色头像按钮受击和死亡显示 */
    private refreshRoleBtnAttackState() {
        this.attackedRoomSet.clear();
        for (let i = 0; i < enemyMgr.enemyArr.length; i++) {
            let enemyComp = enemyMgr.enemyArr[i];
            if (!enemyComp || enemyComp.hp <= 0) {
                continue;
            }

            let roomIdx = enemyComp.attackingRoomIdx;
            if (roomIdx > 0) {
                this.attackedRoomSet.add(roomIdx);
            }
        }

        for (let roleIdKey in this.roleBtnStateMap) {
            let roleId = Number(roleIdKey);
            let roleComp = this.getRoleCompById(roleId);
            let stateData = this.roleBtnStateMap[roleId];
            if (!stateData || !stateData.roleBtn?.isValid) {
                continue;
            }

            let isDead = roleComp?.state == roleState.dead;
            let isRoomAttacked = !isDead && roleComp?.roomIdx > 0 && this.attackedRoomSet.has(roleComp.roomIdx);
            if (stateData.lastIsDead == isDead && stateData.lastIsRoomAttacked == isRoomAttacked) {
                continue;
            }

            if (stateData.lastIsDead != isDead) {
                this.refreshRoleBtnDeadState(stateData, isDead);
            }
            stateData.lastIsDead = isDead;
            stateData.lastIsRoomAttacked = isRoomAttacked;
            this.setRoleBtnAttackAnim(stateData, isRoomAttacked, isDead, !isDead);
        }
    }

    /**按固定低频刷新角色头像状态 */
    private refreshRoleBtnAttackStateByInterval(dt: number) {
        this.roleBtnStateRefreshTimer += dt;
        if (this.roleBtnStateRefreshTimer < ROLE_BUTTON_STATE_REFRESH_INTERVAL) {
            return;
        }

        this.roleBtnStateRefreshTimer %= ROLE_BUTTON_STATE_REFRESH_INTERVAL;
        this.refreshRoleBtnAttackState();
    }

    /**刷新角色头像死亡状态 */
    private refreshRoleBtnDeadState(stateData: roleBtnStateData, isDead: boolean) {
        if (stateData.attackNode) {
            stateData.attackNode.active = isDead;
        }
        if (stateData.avatarSprite) {
            stateData.avatarSprite.grayscale = isDead;
        }
    }

    /**设置角色头像受击动画状态 */
    private setRoleBtnAttackAnim(stateData: roleBtnStateData, needPlay: boolean, forceReset: boolean = false, resetDeadDisplay: boolean = true) {
        stateData.needLoopAttackAnim = needPlay;
        if (needPlay && !stateData.isAttackAnimPlaying) {
            this.playRoleBtnAttackAnim(stateData);
            return;
        }

        if (!needPlay && (forceReset || !stateData.isAttackAnimPlaying)) {
            this.resetRoleBtnState(stateData, resetDeadDisplay);
        }
    }

    /**重置角色头像按钮常规状态 */
    private resetRoleBtnState(stateData: roleBtnStateData, resetDeadDisplay: boolean = true) {
        if (!stateData) {
            return;
        }

        stateData.isAttackAnimPlaying = false;
        stateData.needLoopAttackAnim = false;

        if (stateData.avatarNode && stateData.avatarNode.isValid) {
            Tween.stopAllByTarget(stateData.avatarNode);
            stateData.avatarNode.setPosition(stateData.baseAvatarPos);
        }
        if (stateData.redMaskOpacity && stateData.redMaskOpacity.isValid) {
            Tween.stopAllByTarget(stateData.redMaskOpacity);
            stateData.redMaskOpacity.opacity = 0;
        }
        if (resetDeadDisplay) {
            if (stateData.attackNode) {
                stateData.attackNode.active = false;
            }
            if (stateData.avatarSprite) {
                stateData.avatarSprite.grayscale = false;
            }
        }
    }

    /**播放单次头像受击动画 */
    private playRoleBtnAttackAnim(stateData: roleBtnStateData) {
        let avatarNode = stateData.avatarNode;
        if (!avatarNode || !avatarNode.isValid) {
            return;
        }

        stateData.isAttackAnimPlaying = true;
        Tween.stopAllByTarget(avatarNode);
        if (stateData.redMaskOpacity) {
            Tween.stopAllByTarget(stateData.redMaskOpacity);
            stateData.redMaskOpacity.opacity = 0;
        }
        avatarNode.setPosition(stateData.baseAvatarPos);

        let animTime = 0.4;

        tween(avatarNode)
            .to(animTime / 4, { position: new Vec3(stateData.baseAvatarPos.x - 4, stateData.baseAvatarPos.y, stateData.baseAvatarPos.z) })
            .to(animTime / 2, { position: new Vec3(stateData.baseAvatarPos.x + 4, stateData.baseAvatarPos.y, stateData.baseAvatarPos.z) })
            .to(animTime / 4, { position: stateData.baseAvatarPos.clone() })
            .call(() => {
                stateData.isAttackAnimPlaying = false;
                avatarNode.setPosition(stateData.baseAvatarPos);
                if (stateData.needLoopAttackAnim) {
                    this.playRoleBtnAttackAnim(stateData);
                }
            })
            .start();

        if (stateData.redMaskOpacity) {
            tween(stateData.redMaskOpacity)
                .to(animTime / 2, { opacity: 255 })
                .to(animTime / 2, { opacity: 0 })
                .start();
        }
    }

    /**通过角色id获取角色组件 */
    getRoleCompById(roleId: number): roleController {
        if (playerMgr.playerComp && playerMgr.playerComp.roleId == roleId) {
            return playerMgr.playerComp;
        }

        for (let i = 0; i < this.robotArr.length; i++) {
            let roleComp = this.robotArr[i];
            if (roleComp && roleComp.roleId == roleId) {
                return roleComp;
            }
        }

        return null;
    }

    /**敌人模式下幸存者被击败后，全部六人死亡即获得胜利 */
    onEnemyModeRoleDefeated() {
        if (!this.isEnemyMode || this.isEnemyModeGameOver || this.robotArr.length < 6) {
            return;
        }

        for (let i = 0; i < this.robotArr.length; i++) {
            if (this.robotArr[i]?.state != roleState.dead) {
                return;
            }
        }

        this.isEnemyModeGameOver = true;
        uiMgr.openPage(UIPath.UISuccess, {
            isEnemyMode: true,
            skinId: this.controlledEnemy?.skinId ?? pData.enemySkinId,
            survivalTime: this.getGameStartElapsedTime(),
        });
    }

    /**敌人模式下玩家控制的敌人被击败，展示击败它的角色动画 */
    onEnemyModeEnemyDefeated(killerSkinId: number, survivalTime: number) {
        if (!this.isEnemyMode || this.isEnemyModeGameOver) {
            return;
        }

        this.isEnemyModeGameOver = true;
        uiMgr.openPage(UIPath.UIFail, {
            isEnemyMode: true,
            skinId: Number.isInteger(killerSkinId) && killerSkinId >= 0 ? killerSkinId : 0,
            survivalTime,
        });
    }

    /**初始化敌人 */
    initEnemy() {
        let enemyNode = instantiate(this.enemyPre);
        this.roleNode.addChild(enemyNode);
        let enemyComp: enemyBaseController = enemyNode.getComponent(enemyBaseController);
        enemyMgr.enemyArr.push(enemyComp);
        let skinId = this.matchEnemySkinId;
        enemyComp.init(this, enemyMgr.enemyId, skinId, this.matchEnemyNickname);
        enemyComp.setPlayerControlled(this.isEnemyMode);
        if (this.isEnemyMode) {
            this.controlledEnemy = enemyComp;
        }
        enemyMgr.enemyId++;

        let randomIdx = Math.floor(Math.random() * enemyMgr.enemyBornPosArr.length);
        let pos = ccTools.getPosByTileIndex(enemyMgr.enemyBornPosArr[randomIdx]);
        enemyNode.setPosition(pos);
    }

    /**初始化角色位置 */
    initRolePos(node) {
        if (this.bornPosArr.length == 0) {
            console.warn("没有出生位置了");
            return;
        }
        let roleComp: roleController = node.getComponent(roleController);
        let randomIdx = Math.floor(Math.random() * this.bornPosArr.length);
        roleComp.currentPos = this.bornPosArr[randomIdx];
        this.bornPosArr.splice(randomIdx, 1);
        let pos = ccTools.getPosByTileIndex(roleComp.currentPos);
        node.setPosition(pos);
    }

    /**生成建筑道具 */
    createProps(tilePos, propsType: tilePropsType, level: number = 0) {
        let tileData = this.tileMap[tilePos.x][tilePos.y];
        let tileComp = tileData.item;
        if (!tileComp) {
            //不存在瓦片就添加瓦片
            tileComp = this.createTileItem(tilePos, tileData.roomIdx);
        }
        this.playPropsFog(tileComp.node.worldPosition, audioPath.build);
        tileComp.addProps(propsType, level);
        let buildRole = this.getBuildRoleByRoomIdx(tileData.roomIdx);
        buildRole?.addGamePropsBuildCount(propsType);
        let isPlayerGuideRoom = this.isGuideRoom(tileData.roomIdx)
            && tileData.roomIdx == playerMgr.playerComp?.roomIdx;
        if (isPlayerGuideRoom && propsType == tilePropsType.generator && this.isGuideGeneratorBuildReady) {
            this.completeGuideGeneratorBuild();
        } else if (isPlayerGuideRoom && propsType == tilePropsType.cannon && this.isGuideCannonBuildReady) {
            this.completeGuideCannonBuild();
        }
        this.refreshGuideBuildTilePosAfterCreate(tilePos);
    }

    /**在道具所在位置播放一次雾气动画 */
    playPropsFog(worldPos: Vec3, audioName: string = "") {
        if (this.playGameAnim(this.gameBottomUINode, uiMgr.fogAnimClip, worldPos) && audioName) {
            this.playSceneEffect(audioName, worldPos);
        }
    }

    /**在音效来源位于游戏摄像机内时播放场景音效 */
    playSceneEffect(audioName: string, worldPos: Vec3) {
        if (!audioName || !this.node.activeInHierarchy || !this.gameCameraComp?.isWorldPosVisible(worldPos)) {
            return;
        }
        audioMgr.playSceneEffect(audioName);
    }

    /**在人物上层播放一次敌人爆气动画 */
    playEnemyAirAnim(clip: AnimationClip, worldPos: Vec3, roleAnimNode: Node = null) {
        let roleAnimHeight = roleAnimNode?.getComponent(UITransform)?.height || 0;
        this.playGameAnim(this.gameUINode, clip, worldPos, roleAnimHeight / 2);
    }

    /**在敌人上方播放一次升级动画，结束后自动销毁 */
    playEnemyUpgradeAnim(worldPos: Vec3, roleAnimNode: Node = null) {
        let roleAnimHeight = roleAnimNode?.getComponent(UITransform)?.height || 0;
        this.playGameAnim(this.gameUINode, uiMgr.upgradeAnimClip, worldPos, roleAnimHeight / 2, true);
    }

    /**在指定游戏层按世界坐标播放一次动画，完成后回收 */
    private playGameAnim(parent: Node, clip: AnimationClip, worldPos: Vec3, localOffsetY: number = 0, destroyOnFinish: boolean = false) {
        if (!uiMgr.gameAnimItemPrefab || !parent || !clip || !worldPos) {
            return false;
        }

        let animNode = poolMgr.getGameAnimNode(uiMgr.gameAnimItemPrefab);
        let parentTransform = parent.getComponent(UITransform);
        if (!parentTransform) {
            poolMgr.putGameAnimNode(animNode);
            return false;
        }

        parent.addChild(animNode);
        let localPos = parentTransform.convertToNodeSpaceAR(worldPos);
        localPos.y += localOffsetY;
        animNode.setPosition(localPos);
        let animComp = animNode.getComponent(gameAnimController);
        if (!animComp) {
            poolMgr.putGameAnimNode(animNode);
            return false;
        }

        animComp.startAnim(clip, () => {
            if (destroyOnFinish) {
                animNode.destroy();
            } else {
                poolMgr.putGameAnimNode(animNode);
            }
        });
        return true;
    }

    /**通过房间号获取建造归属角色 */
    private getBuildRoleByRoomIdx(roomIdx: number) {
        if (roomIdx <= 0) {
            return null;
        }

        let playerComp = playerMgr.playerComp;
        if (playerComp && playerComp.roomIdx == roomIdx) {
            return playerComp;
        }

        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            if (robotComp && robotComp.roomIdx == roomIdx) {
                return robotComp;
            }
        }

        return null;
    }

    /**通过房间号获取房间归属角色的皮肤 */
    getRoleSkinIdByRoomIdx(roomIdx: number) {
        let roleComp = this.getBuildRoleByRoomIdx(roomIdx);
        return roleComp ? roleComp.skinId : pData.skinId;
    }

    /**获取倒计时结束后的本局经过时间 */
    getGameStartElapsedTime() {
        return this.gameStartElapsedTime;
    }

    /**创建瓦片节点 */
    private createTileItem(tilePos: Vec2, roomIdx: number = 0) {
        let tileItem = poolMgr.getTileItem(this.tileItemPre);
        this.tileObjList.addChild(tileItem);
        let tileComp = tileItem.getComponent(tileItemController);
        tileItem.position = ccTools.getPosByTileIndex(tilePos);
        tileComp.roomIdx = roomIdx;
        tileComp.pos = tilePos;
        tileComp.bindGameComp(this);
        this.tileMap[tilePos.x][tilePos.y].item = tileComp;
        return tileComp;
    }

    /**开局按地图随机点位生成随机道具 */
    private createRandomPropsByMapPoint() {
        let buildPosArr = this.getBuildableRandomPropsPosArr();
        let createNum = Math.min(this.getRandomPropsCreateNum(), buildPosArr.length);
        if (createNum <= 0) {
            return;
        }

        let createCount = 0;
        while (createCount < createNum && buildPosArr.length > 0) {
            let randomPosIdx = Math.floor(Math.random() * buildPosArr.length);
            let buildPos = buildPosArr[randomPosIdx];
            buildPosArr.splice(randomPosIdx, 1);

            let roomIdx = this.tileMap[buildPos.x]?.[buildPos.y]?.roomIdx || 0;
            let propsData = this.getRandomBuildablePropsData(roomIdx);
            if (!propsData) {
                continue;
            }

            this.createInitialProps(buildPos, propsData.propsType as tilePropsType, propsData.level, true, false);
            createCount++;
        }
    }

    /**开局按房间概率在床边生成初始道具 */
    private createRandomPropsAroundRoomBed() {
        let roomKeys = Object.keys(this.roomMap || {});
        for (let i = 0; i < roomKeys.length; i++) {
            let roomIdx = Number(roomKeys[i]);
            let roomData: roomData = this.roomMap[roomIdx];
            if (!roomData || Math.random() > configData.roomPropsProbability) {
                continue;
            }

            let buildPos = this.getRandomEmptyPosAroundBed(roomData, roomIdx);
            if (!buildPos) {
                continue;
            }

            let propsData = this.getRandomBuildablePropsData(roomIdx);
            if (!propsData) {
                continue;
            }

            this.createInitialProps(buildPos, propsData.propsType as tilePropsType, propsData.level, false, true);
        }
    }

    /**获取可放置随机道具的地图点位 */
    private getBuildableRandomPropsPosArr() {
        let result: Vec2[] = [];
        for (let i = 0; i < this.randomPropsPosArr.length; i++) {
            let tilePos = this.randomPropsPosArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || tileData.block == 1 || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            result.push(tilePos);
        }

        return result;
    }

    /**随机道具生成数量，左闭右闭 */
    private getRandomPropsCreateNum() {
        let numRange = configData.randomPropsNum || [0, 0];
        let min = Math.floor(Number(numRange[0]) || 0);
        let max = Math.floor(Number(numRange[1]) || min);
        if (max < min) {
            let temp = min;
            min = max;
            max = temp;
        }

        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /**在指定位置生成开局道具，不记录角色建造次数 */
    private createInitialProps(tilePos: Vec2, propsType: tilePropsType, level: number = 0, isRandomPickProps: boolean = false, isAutoStartProps: boolean = true) {
        let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
        if (!tileData) {
            return;
        }

        let tileComp = tileData.item;
        if (!tileComp) {
            tileComp = this.createTileItem(tilePos, tileData.roomIdx);
        }

        tileComp.addProps(propsType, level, true, isAutoStartProps);
        tileComp.isRandomPickProps = isRandomPickProps;
        tileComp.randomPickPropsRobotId = 0;
    }

    /**获取未被人机预定的可拾取随机道具 */
    getUsableRandomPickPropsCandidates() {
        let result: { propsPos: Vec2, tileItem: tileItemController }[] = [];
        for (let i = 0; i < this.randomPropsPosArr.length; i++) {
            let tilePos = this.randomPropsPosArr[i];
            let tileItem = this.getPickableRandomPropsTile(tilePos);
            let roomIdx = this.tileMap[tilePos.x]?.[tilePos.y]?.roomIdx || 0;
            if (!tileItem || tileItem.randomPickPropsRobotId > 0 || this.isGuideRoom(roomIdx)) {
                continue;
            }

            result.push({ propsPos: new Vec2(tilePos.x, tilePos.y), tileItem: tileItem });
        }

        return result;
    }

    /**预定随机道具 */
    reserveRandomPickProps(tilePos: Vec2, robotId: number) {
        let tileItem = this.getPickableRandomPropsTile(tilePos);
        if (!tileItem || tileItem.randomPickPropsRobotId > 0) {
            return false;
        }

        tileItem.randomPickPropsRobotId = robotId;
        return true;
    }

    /**清理随机道具预定 */
    clearRandomPickPropsReservation(tilePos: Vec2, robotId: number) {
        let tileItem = this.getPickableRandomPropsTile(tilePos);
        if (!tileItem || tileItem.randomPickPropsRobotId != robotId) {
            return;
        }

        tileItem.randomPickPropsRobotId = 0;
    }

    /**人机拾取地图随机道具 */
    robotPickupRandomProps(tilePos: Vec2, robotId: number, targetParent: Node) {
        let tileItem = this.getPickableRandomPropsTile(tilePos);
        if (!tileItem || !targetParent || !targetParent.isValid || (tileItem.randomPickPropsRobotId > 0 && tileItem.randomPickPropsRobotId != robotId)) {
            return null;
        }

        let propComp = tileItem.propsComp;
        let propsData = {
            propsType: tileItem.tileType,
            level: propComp?.level || 0,
            isSpecialSellProps: propComp?.isSpecialSellProps || false,
            propsNode: tileItem.takePropsItem(targetParent),
            propsComp: propComp,
        };

        if (!propsData.propsNode) {
            return null;
        }

        gm.Event.emit(GameEvent.refreshPlayerPos);
        this.refreshRobotTargetByRandomProps(tilePos, robotId);
        return propsData;
    }

    /**人机把携带的随机道具放置到房间空位 */
    placeRobotRandomPropsInRoom(roomIdx: number, propsData: { propsType: tilePropsType, level: number, isSpecialSellProps: boolean }, robotComp: roleController) {
        if (!propsData) {
            return true;
        }

        if (this.isCarriedPropsBuildNumLimit(roomIdx, propsData.propsType, propsData.level)) {
            return true;
        }

        let roomData: roomData = this.roomMap[roomIdx];
        let buildPos = this.getRandomEmptyPosInRoom(roomData);
        if (!buildPos) {
            return false;
        }

        let tileData = this.tileMap[buildPos.x]?.[buildPos.y];
        let tileComp = tileData?.item;
        if (!tileComp) {
            tileComp = this.createTileItem(buildPos, roomIdx);
        }

        this.playPropsFog(tileComp.node.worldPosition, audioPath.build);
        tileComp.addProps(propsData.propsType, propsData.level, propsData.isSpecialSellProps, true);
        tileComp.isRandomPickProps = false;
        tileComp.randomPickPropsRobotId = 0;
        robotComp?.addGamePropsBuildCount(propsData.propsType);
        return true;
    }

    /**拾取地图随机道具 */
    private pickupRandomProps(tileItem: tileItemController) {
        if (!tileItem || !tileItem.isRandomPickProps || this.carriedRandomProps) {
            return false;
        }

        let propComp = tileItem.propsComp;
        let propsType = tileItem.tileType;
        let level = propComp?.level || 0;
        let isSpecialSellProps = propComp?.isSpecialSellProps || false;
        let propsNode = tileItem.takePropsItem(playerMgr.player);
        if (!propsNode) {
            return false;
        }

        propsNode.setPosition(this.getCarriedPropsLocalPos());
        propsNode.setScale(new Vec3(0.7, 0.7, 1));

        this.carriedRandomProps = {
            propsType: propsType,
            level: level,
            isSpecialSellProps: isSpecialSellProps,
            propsNode: propsNode,
            propsComp: propComp,
        };
        this.refreshRobotTargetByRandomProps(tileItem.pos, 0);
        return true;
    }

    /**获取携带道具相对玩家节点的位置 */
    private getCarriedPropsLocalPos() {
        let pos = new Vec3(this.carriedPropsLocalPos.x, this.carriedPropsLocalPos.y, this.carriedPropsLocalPos.z);
        let roleAnim = playerMgr.player?.getChildByName("roleAnim");
        let roleAnimTrans = roleAnim?.getComponent(UITransform);
        if (roleAnimTrans) {
            pos.y = roleAnimTrans.height / 2;
        }

        return pos;
    }

    /**清理当前携带的随机道具节点 */
    private clearCarriedRandomProps() {
        if (!this.carriedRandomProps) {
            return;
        }

        let carriedData = this.carriedRandomProps;
        carriedData.propsComp?.clearData();
        if (carriedData.propsComp) {
            carriedData.propsComp.enabled = false;
        }
        // 随身道具按类型回池，保留节点和脚本供后续关卡复用
        poolMgr.putPropsNode(carriedData.propsNode, carriedData.propsType);
        this.carriedRandomProps = null;
    }

    /**将携带的随机道具放置到房间空位 */
    private placeCarriedRandomPropsInRoom(roomIdx: number) {
        if (!this.carriedRandomProps) {
            return true;
        }

        let carriedData = this.carriedRandomProps;
        if (this.isCarriedPropsBuildNumLimit(roomIdx, carriedData.propsType, carriedData.level)) {
            this.clearCarriedRandomProps();
            return true;
        }

        let roomData: roomData = this.roomMap[roomIdx];
        let buildPos = this.getRandomEmptyPosInRoom(roomData);
        if (!buildPos) {
            uiMgr.showTips("房间没有空位放置道具");
            return false;
        }

        carriedData.propsComp?.clearData();
        if (carriedData.propsComp) {
            carriedData.propsComp.enabled = false;
        }
        // 放置结束后不销毁节点，交回对应类型的道具池
        poolMgr.putPropsNode(carriedData.propsNode, carriedData.propsType);
        this.carriedRandomProps = null;

        let tileData = this.tileMap[buildPos.x]?.[buildPos.y];
        let tileComp = tileData?.item;
        if (!tileComp) {
            tileComp = this.createTileItem(buildPos, roomIdx);
        }

        this.playPropsFog(tileComp.node.worldPosition, audioPath.build);
        tileComp.addProps(carriedData.propsType, carriedData.level, carriedData.isSpecialSellProps, true);
        tileComp.isRandomPickProps = false;
        return true;
    }

    /**随机获取房间内空闲位置 */
    private getRandomEmptyPosInRoom(roomData: roomData) {
        if (!roomData || !roomData.roomArr) {
            return null;
        }

        let emptyPosArr: Vec2[] = [];
        for (let i = 0; i < roomData.roomArr.length; i++) {
            let tilePos = roomData.roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos) || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            emptyPosArr.push(tilePos);
        }

        if (emptyPosArr.length == 0) {
            return null;
        }

        let randomIdx = Math.floor(Math.random() * emptyPosArr.length);
        return emptyPosArr[randomIdx];
    }

    /**获取离目标最近的引导空闲格，并避开另一条建造引导的提示格 */
    private getGuideEmptyPosNearestTo(roomData: roomData, targetPos: Vec2, excludePos: Vec2 = null) {
        if (!roomData?.roomArr || !targetPos) {
            return null;
        }

        let nearestPos: Vec2 = null;
        let nearestDistanceSqr = Number.MAX_VALUE;
        for (let i = 0; i < roomData.roomArr.length; i++) {
            let tilePos = roomData.roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos)
                || this.isSameTilePos(tilePos, excludePos)
                || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            let offsetX = tilePos.x - targetPos.x;
            let offsetY = tilePos.y - targetPos.y;
            let distanceSqr = offsetX * offsetX + offsetY * offsetY;
            if (distanceSqr < nearestDistanceSqr) {
                nearestDistanceSqr = distanceSqr;
                nearestPos = tilePos;
            }
        }

        return nearestPos;
    }

    /**随机获取床边上下左右空闲位置 */
    private getRandomEmptyPosAroundBed(roomData: roomData, roomIdx: number) {
        let bedPos = roomData?.bedPos;
        if (!bedPos) {
            return null;
        }

        let dirArr = [
            new Vec2(0, 1),
            new Vec2(0, -1),
            new Vec2(-1, 0),
            new Vec2(1, 0),
        ];
        let emptyPosArr: Vec2[] = [];
        for (let i = 0; i < dirArr.length; i++) {
            let tilePos = new Vec2(bedPos.x + dirArr[i].x, bedPos.y + dirArr[i].y);
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || tileData.roomIdx != roomIdx || this.isSameTilePos(tilePos, roomData.doorPos) || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            emptyPosArr.push(tilePos);
        }

        if (emptyPosArr.length == 0) {
            return null;
        }

        let randomIdx = Math.floor(Math.random() * emptyPosArr.length);
        return emptyPosArr[randomIdx];
    }

    /**获取未达到房间生成上限的随机道具 */
    private getRandomBuildablePropsData(roomIdx: number) {
        let randomPropsData = propsConfig.getRandomPropsData();
        let result: JsonPropsData[] = [];

        for (let i = 0; i < randomPropsData.length; i++) {
            let propsData = randomPropsData[i];
            if (this.isRoomBuildNumLimit(roomIdx, propsData)) {
                continue;
            }

            result.push(propsData);
        }

        if (result.length == 0) {
            return null;
        }

        let randomIdx = Math.floor(Math.random() * result.length);
        return result[randomIdx];
    }

    /**是否达到当前房间建造数量上限 */
    private isRoomBuildNumLimit(roomIdx: number, propsData: JsonPropsData) {
        if (!propsData?.builNumMax || propsData.builNumMax <= 0) {
            return false;
        }

        return this.getRoomPropsCountByType(roomIdx, propsData.propsType) >= propsData.builNumMax;
    }

    /**携带的随机道具是否达到目标房间建造上限 */
    private isCarriedPropsBuildNumLimit(roomIdx: number, propsType: tilePropsType, level: number) {
        let propsData = propsConfig.getPropsData(propsType)?.[level];
        return this.isRoomBuildNumLimit(roomIdx, propsData);
    }

    /**敌人破坏床铺后，将房间瓦片补齐并置灰 */
    grayRoomAfterBedDestroyed(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !roomData.roomArr) {
            return;
        }

        for (let i = 0; i < roomData.roomArr.length; i++) {
            let tilePos = roomData.roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            if (!tileData) {
                continue;
            }

            let tileComp = tileData.item;
            if (!tileComp) {
                tileComp = this.createTileItem(tilePos, roomIdx);
            }

            tileComp.grayTile();
        }
    }

    /**升级建筑道具 */
    upgradeProps(tilePos) {
        let tileData = this.tileMap[tilePos.x][tilePos.y];
        let tileComp = tileData.item;
        if (!tileComp) {
            return;
        }
        let propComp = tileComp.propsComp;
        if (!propComp) {
            return;
        }
        propComp.upgradeProps();
    }

    /**升级指定房间内的指定类型道具 */
    upgradeRoomPropsByType(roomIdx: number, propsType: string, maxLevel: number = -1) {
        if (roomIdx <= 0 || !propsType) {
            return false;
        }

        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return false;
        }

        let tilePos: Vec2 = null;
        if (propsType == tilePropsType.bed) {
            tilePos = roomData.bedPos;
        } else if (propsType == tilePropsType.door) {
            tilePos = roomData.doorPos;
        } else {
            tilePos = this.getRoomUpgradeablePropsPosByType(roomData, propsType, maxLevel);
        }

        if (!tilePos) {
            return false;
        }

        let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
        if (!propComp || propComp.isMaxLevel || (maxLevel >= 0 && propComp.level >= maxLevel)) {
            return false;
        }

        propComp.upgradeProps();
        return true;
    }

    /**获取房间内可升级的指定类型道具坐标 */
    private getRoomUpgradeablePropsPosByType(roomData: roomData, propsType: string, maxLevel: number = -1) {
        let roomArr = roomData.roomArr || [];
        let result: Vec2 = null;
        let resultLevel = Number.MAX_SAFE_INTEGER;

        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (!propComp || propComp.propsType != propsType || propComp.isMaxLevel || (maxLevel >= 0 && propComp.level >= maxLevel)) {
                continue;
            }

            if (propComp.level < resultLevel) {
                result = tilePos;
                resultLevel = propComp.level;
            }
        }

        return result;
    }

    /**获取房间内指定类型道具数量 */
    getRoomPropsCountByType(roomIdx: number, propsType: string) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !propsType) {
            return 0;
        }

        let count = 0;
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == propsType) {
                count++;
            }
        }

        return count;
    }

    /**刷新指定房间内全部建筑的可升级状态 */
    refreshRoomPropsUpgradeState(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        let roomArr = roomData?.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            this.tileMap[tilePos.x]?.[tilePos.y]?.item?.checkUpgrade();
        }
    }

    /**获取房间内指定类型道具最低等级 */
    getRoomPropsMinLevelByType(roomIdx: number, propsType: string) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !propsType) {
            return -1;
        }

        let minLevel = Number.MAX_SAFE_INTEGER;
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == propsType) {
                minLevel = Math.min(minLevel, propComp.level);
            }
        }

        return minLevel == Number.MAX_SAFE_INTEGER ? -1 : minLevel;
    }

    /**获取房间床等级 */
    getRoomBedLevel(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        let bedPos = roomData?.bedPos;
        if (!bedPos) {
            return -1;
        }

        return this.tileMap[bedPos.x]?.[bedPos.y]?.item?.propsComp?.level ?? -1;
    }

    /**在房间空位建造指定类型道具 */
    buildRoomPropsByType(roomIdx: number, propsType: tilePropsType, level: number = 0) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !propsType) {
            return false;
        }

        let emptyPosArr: Vec2[] = [];
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos) || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            emptyPosArr.push(tilePos);
        }

        if (emptyPosArr.length == 0) {
            return false;
        }

        let randomIdx = Math.floor(Math.random() * emptyPosArr.length);
        this.createProps(emptyPosArr[randomIdx], propsType, level);
        return true;
    }

    /**在最靠近床的空位建造一级矿脉 */
    buildRobotVein(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return false;
        }

        let emptyPosArr = this.getRoomEmptyBuildPosArr(roomData);
        let buildPos = this.getRandomNearestPos(emptyPosArr, roomData.bedPos);
        if (!buildPos) {
            return false;
        }

        this.createProps(buildPos, tilePropsType.vein);
        return true;
    }

    /**随机升级房间内最低等级的矿脉 */
    upgradeRobotVein(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        return !!roomData && this.upgradeLowestRoomPropsByTypeRandom(roomData, tilePropsType.vein);
    }

    /**从指定建筑类型中随机选择一个可建造道具，并放到随机空位 */
    buildRobotRandomPropsByBuildType(roomIdx: number, buildType: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return false;
        }

        let emptyPosArr = this.getRoomEmptyBuildPosArr(roomData);
        if (emptyPosArr.length == 0) {
            return false;
        }

        let typePropsData = propsConfig.getBuildTypePropsData(buildType);
        let candidates: JsonPropsData[] = [];
        for (let i = 0; i < typePropsData.length; i++) {
            if (!this.isRoomBuildNumLimit(roomIdx, typePropsData[i])) {
                candidates.push(typePropsData[i]);
            }
        }

        if (candidates.length == 0) {
            return false;
        }

        let propsData = candidates[Math.floor(Math.random() * candidates.length)];
        let buildPos = emptyPosArr[Math.floor(Math.random() * emptyPosArr.length)];
        this.createProps(buildPos, propsData.propsType as tilePropsType, propsData.level);
        return true;
    }

    /**建造炮台；没有可用空闲格时不执行 */
    buildRobotCannon(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return false;
        }

        let emptyPosArr = this.getRoomEmptyBuildPosArr(roomData);
        let keepGeneratorPosCount = this.hasRoomPropsByType(roomData, tilePropsType.generator) ? 0 : 1;
        if (emptyPosArr.length > keepGeneratorPosCount) {
            let buildPos = this.getRandomNearestPos(emptyPosArr, roomData.doorPos);
            this.createProps(buildPos, tilePropsType.cannon);
            return true;
        }

        return false;
    }

    /**随机升级房间内最低等级的未满级炮台 */
    upgradeRobotCannon(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        return !!roomData && this.upgradeLowestRoomPropsByTypeRandom(roomData, tilePropsType.cannon);
    }

    /**随机出售房间内一个现有炮台 */
    sellRobotCannon(roomIdx: number) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return false;
        }

        let candidates = this.getRoomPropsPosArr(roomData, tilePropsType.cannon);
        if (candidates.length == 0) {
            return false;
        }

        let randomIdx = Math.floor(Math.random() * candidates.length);
        let tilePos = candidates[randomIdx];
        this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp?.removeProps(audioPath.buildSell);
        return true;
    }

    /**获取房间内的空闲可建造格 */
    private getRoomEmptyBuildPosArr(roomData: roomData) {
        let result: Vec2[] = [];
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos) || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            result.push(tilePos);
        }

        return result;
    }

    /**从候选格中随机获取一个离目标最近的位置 */
    private getRandomNearestPos(posArr: Vec2[], targetPos: Vec2) {
        if (!posArr?.length || !targetPos) {
            return null;
        }

        let minDistanceSqr = Number.MAX_VALUE;
        let nearestPosArr: Vec2[] = [];
        for (let i = 0; i < posArr.length; i++) {
            let tilePos = posArr[i];
            let offsetX = tilePos.x - targetPos.x;
            let offsetY = tilePos.y - targetPos.y;
            let distanceSqr = offsetX * offsetX + offsetY * offsetY;
            if (distanceSqr < minDistanceSqr) {
                minDistanceSqr = distanceSqr;
                nearestPosArr = [tilePos];
            } else if (distanceSqr == minDistanceSqr) {
                nearestPosArr.push(tilePos);
            }
        }

        let randomIdx = Math.floor(Math.random() * nearestPosArr.length);
        return nearestPosArr[randomIdx];
    }

    /**获取房间内指定类型建筑的坐标 */
    private getRoomPropsPosArr(roomData: roomData, propsType: tilePropsType) {
        let result: Vec2[] = [];
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == propsType) {
                result.push(tilePos);
            }
        }

        return result;
    }

    /**房间内是否存在指定类型道具 */
    private hasRoomPropsByType(roomData: roomData, propsType: tilePropsType) {
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == propsType) {
                return true;
            }
        }

        return false;
    }

    /**随机升级房间内最低等级的指定类型道具 */
    private upgradeLowestRoomPropsByTypeRandom(roomData: roomData, propsType: tilePropsType) {
        let minLevel = Number.MAX_SAFE_INTEGER;
        let candidates: Vec2[] = [];
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (!propComp || propComp.propsType != propsType || propComp.isMaxLevel) {
                continue;
            }

            if (propComp.level < minLevel) {
                minLevel = propComp.level;
                candidates = [tilePos];
            } else if (propComp.level == minLevel) {
                candidates.push(tilePos);
            }
        }

        if (candidates.length == 0) {
            return false;
        }

        let randomIdx = Math.floor(Math.random() * candidates.length);
        let tilePos = candidates[randomIdx];
        this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp?.upgradeProps();
        return true;
    }

    /**判断两个瓦片坐标是否相同 */
    private isSameTilePos(posA: Vec2, posB: Vec2) {
        return !!posA && !!posB && posA.x == posB.x && posA.y == posB.y;
    }

    /**机器人寻找房间 */
    robotSuchRoom() {
        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            robotComp.suchRoom();
        }
    }

    /**为各机器人设置独立的寻找房间延迟 */
    private startRobotSuchRoomDelays() {
        this.robotSuchRoomDelayMap.clear();
        let startTimeRange = configData.robotStartTime;
        let startTimeMin = Number(startTimeRange?.[0]);
        let startTimeMax = Number(startTimeRange?.[1]);
        if (!Number.isFinite(startTimeMin) || !Number.isFinite(startTimeMax)
            || startTimeMin < 0 || startTimeMax < startTimeMin) {
            console.error("人机开始时间配置异常，将立即开始移动", startTimeRange);
            this.robotSuchRoom();
            return;
        }

        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            let delayTime = startTimeMin + Math.random() * (startTimeMax - startTimeMin);
            if (delayTime <= 0) {
                robotComp.suchRoom();
                continue;
            }

            this.robotSuchRoomDelayMap.set(robotComp, delayTime);
        }
    }

    /**倒计时结束 */
    countDownEnd() {
        if (this.isGameStartCountDownEnd) {
            return;
        }

        this.timeNode.active = false;
        this.isGameStartCountDownEnd = true;
        this.stopGameCountDown();
        this.refreshRepairBtnVisible();

        uiMgr.showTips("感染者开始行动");
        audioMgr.playEffect(audioPath.shangshikaichang);
        if (this.isEnemyMode) {
            this.isEnemyCameraFollowing = true;
            this.rockerTouchNode.active = true;
            this.slideTouchNode.active = false;
            this.rockerReset();
        } else {
            enemyMgr.enemyArr[0]?.chooseTargetAndFindPath();
        }
    }

    /**刷新倒计时 */
    refreshCountDown() {
        if (this.isGamePause) {
            return;
        }

        this.gameStartCountDownTime--;
        if (this.gameStartCountDownTime < 10) {
            audioMgr.playEffect(audioPath.daojishi);
        }
        if (this.gameStartCountDownTime <= 0) {
            this.countDownEnd();
            return;
        }
        let timeLabel = this.timeNode.getChildByName("timeLab").getComponent(Label);
        timeLabel.string = this.gameStartCountDownTime.toString();
    }

    /**停止游戏开始倒计时 */
    stopGameCountDown() {
        this.unschedule(this.refreshCountDown);
    }

    /**开始游戏倒计时 */
    startGameCountDown() {
        this.isGameStartCountDownEnd = false;
        if (this.isEnemyMode) {
            this.isEnemyCameraFollowing = false;
            this.rockerTouchNode.active = false;
            this.slideTouchNode.active = true;
            if (this.controlledEnemy?.node) {
                this.gameCameraComp?.setCameraPos(this.controlledEnemy.node.position, true);
            }
        }
        this.refreshRepairBtnVisible();
        this.gameStartCountDownTime = enemyCommonConfig.enemyStartTime;
        let timeLabel = this.timeNode.getChildByName("timeLab").getComponent(Label);
        timeLabel.string = this.gameStartCountDownTime.toString();
        this.timeNode.active = true;

        this.schedule(this.refreshCountDown, 1);
    }

    /**刷新修复按钮显隐 */
    private refreshRepairBtnVisible() {
        if (this.isEnemyMode) {
            this.repairBtn.active = false;
            return;
        }
        this.repairBtn.active = this.isGameStartCountDownEnd && playerMgr.playerComp?.roomIdx > 0;
    }

    /**获取技能对应的 Boss 配置；第 0 个按钮对应 skillUnlock = 1 */
    private getSkillConfig(idx: number): JsonBossData {
        return bossConfig.tableData.find(data => Number(data?.skillUnlock) == idx + 1) || null;
    }

    /**刷新技能节点的显隐、解锁和冷却状态 */
    private refreshSkillNode(dt: number = 0) {
        if (!this.skillNode) {
            return;
        }

        this.skillNode.active = this.isEnemyMode;
        if (!this.isEnemyMode) {
            return;
        }

        let enemyLevel = (this.controlledEnemy?.level || 0) + 1;
        for (let idx = 0; idx < this.skillNode.children.length; idx++) {
            let skillBtn = this.skillNode.children[idx];
            let skillConfig = this.getSkillConfig(idx);
            let unlockLevel = Number(skillConfig?.quantity) || 0;
            let isUnlocked = !!skillConfig && enemyLevel >= unlockLevel;
            let cooldownTime = Math.max(0, this.skillCoolDownTimes[idx] || 0);
            if (dt > 0 && cooldownTime > 0) {
                cooldownTime = Math.max(0, cooldownTime - dt);
                this.skillCoolDownTimes[idx] = cooldownTime;
            }

            let img = skillBtn.getChildByName("img")?.getComponent(Sprite);
            if (img) {
                img.grayscale = !isUnlocked;
            }

            let labelNode = skillBtn.getChildByName("Label");
            if (labelNode) {
                labelNode.active = !isUnlocked;
                let label = labelNode.getComponent(Label);
                if (label) {
                    label.string = `${unlockLevel}级解锁`;
                }
            }

            let mask = skillBtn.getChildByName("mask")?.getComponent(Sprite);
            if (mask) {
                let totalCooldown = Math.max(0, Number(skillConfig?.skillCooldownTime) || 0);
                mask.node.active = isUnlocked && cooldownTime > 0;
                mask.fillRange = totalCooldown > 0 ? cooldownTime / totalCooldown : 0;
            }
        }
    }

    /**游戏开始倒计时是否已结束 */
    get isEnemyCanMove() {
        return this.isGameStartCountDownEnd && !this.isGamePause && !this.isRoleDisappearPlaying;
    }

    /**响应全局游戏暂停 */
    private onGamePause() {
        this.isGamePause = true;
        this.rockerTouchNode.active = false;
        this.slideTouchNode.active = false;
        this.rockerReset();
    }

    /**响应全局游戏继续 */
    private onGameResume() {
        this.isGamePause = false;

        if (this.isEnemyMode) {
            this.rockerTouchNode.active = this.isGameStartCountDownEnd;
            this.slideTouchNode.active = !this.isGameStartCountDownEnd;
            return;
        }

        if (playerMgr.playerComp?.roomIdx > 0) {
            this.rockerTouchNode.active = false;
            this.slideTouchNode.active = true;
        } else {
            this.rockerTouchNode.active = true;
            this.slideTouchNode.active = false;
        }

        this.refreshRepairBtnVisible();
    }

    /**刷新修复按钮冷却遮罩 */
    private refreshRepairMask(dt: number) {
        if (this.repairCoolDownTime <= 0) {
            this.repairCoolDownTime = 0;
            this.repairMask.fillRange = 0;
            this.repairMask.node.active = false;
            return;
        }

        this.repairMask.node.active = true;
        this.repairCoolDownTime = Math.max(0, this.repairCoolDownTime - dt);
        this.repairMask.fillRange = this.repairCoolDownTime / configData.repairCoolDown;
    }

    /**摇杆归位 */
    rockerReset() {
        let rockerNode = this.rockerTouchNode.getChildByName("rockerNode");
        let rockerPoint = rockerNode.getChildByName("rockerPoint");
        rockerNode.setPosition(this.rockerInitPos);
        rockerPoint.position = Vec3.ZERO;

        this.isMoving = false;
        if (this.isEnemyMode) {
            this.controlledEnemy?.stopPlayerInputMove();
        } else {
            playerMgr.playerComp?.playRoleAnim(roleAnimName.idle, true);
        }
    }

    /**限制坐标移动 */
    limitMovePos(offsetPos: Vec3) {
        //预测玩家移动
        let prePlayerPos = new Vec3(playerMgr.player.position.x + offsetPos.x, playerMgr.player.position.y + offsetPos.y, 0);

        let limitPos = new Vec3(prePlayerPos.x, prePlayerPos.y, 0);
        let preTilePos = ccTools.getTileIndexByNodePos(prePlayerPos);
        if (preTilePos != playerMgr.playerComp.currentPos) {
            //当要换瓦片时，需要判断是否可移动
            if (this.tileMap[preTilePos.x][preTilePos.y].block == 1) {
                let overX = false;
                let overY = false;
                let ridus = configData.tileSize / 2;
                let curPos = ccTools.getPosByTileIndex(playerMgr.playerComp.currentPos);
                //限制x
                if (prePlayerPos.x < curPos.x - ridus) {
                    limitPos.x = curPos.x - ridus;
                    overX = true;
                } else if (prePlayerPos.x > curPos.x + ridus) {
                    limitPos.x = curPos.x + ridus;
                    overX = true;
                }

                //限制y
                if (prePlayerPos.y < curPos.y - ridus) {
                    limitPos.y = curPos.y - ridus;
                    overY = true;
                } else if (prePlayerPos.y > curPos.y + ridus) {
                    limitPos.y = curPos.y + ridus;
                    overY = true;
                }

                let canMove = false;
                //检测是否可以向x轴或者y轴移动
                if (overX && offsetPos.x != 0) {
                    //可以向x轴移动
                    let xAdd = offsetPos.x > 0 ? 1 : -1;
                    if (this.tileMap[playerMgr.playerComp.currentPos.x + xAdd][playerMgr.playerComp.currentPos.y].block != 1) {
                        canMove = true;
                        playerMgr.playerComp.currentPos.x += xAdd;
                    }
                }

                //不可向x轴移动，检测是否可以向y轴移动
                if (!canMove && overY && offsetPos.y != 0) {
                    //可以向y轴移动
                    let yAdd = offsetPos.y > 0 ? -1 : 1;
                    if (this.tileMap[playerMgr.playerComp.currentPos.x][playerMgr.playerComp.currentPos.y + yAdd].block != 1) {
                        playerMgr.playerComp.currentPos.y += yAdd;
                    }
                }
            } else {
                playerMgr.playerComp.currentPos = preTilePos;
            }
        }

        return limitPos;
    }

    /**检测单个瓦片是否不可走，越界也按不可走处理 */
    private isBlockTile(tileX: number, tileY: number) {
        if (tileX < 0 || tileY < 0 || tileX >= pData.mapSize.width || tileY >= pData.mapSize.height) {
            return true;
        }

        return this.tileMap[tileX][tileY].block == 1;
    }

    /**检测单个瓦片是否不可走，角色脚下当前瓦片即使被关门改成block也允许离开 */
    private isBlockTileForMove(tileX: number, tileY: number, currentTilePos: Vec2, blockRoomProps = false) {
        if (tileX == currentTilePos.x && tileY == currentTilePos.y) {
            return false;
        }

        if (this.isBlockTile(tileX, tileY)) {
            return true;
        }

        if (!blockRoomProps) {
            return false;
        }

        let tileData = this.tileMap[tileX]?.[tileY];
        let tileItem = tileData?.item;
        if (!tileData?.roomIdx || !tileItem?.propsComp) {
            return false;
        }

        // 未关闭的房门是感染者进入房间时唯一可直接通行的道具格。
        if (tileItem.tileType == tilePropsType.door) {
            let doorComp = tileItem.propsComp as doorProps;
            return !doorComp || doorComp.isClose;
        }

        return true;
    }

    /**玩家移动碰撞矩形是否仍与指定瓦片重叠 */
    private isPlayerMoveMatrixOverlappingTile(tilePos: Vec2, matrixWidth = 20, matrixHeight = 25, matrixOffsetPos: Vec2 = this.defaultMoveMatrixOffset) {
        if (!tilePos || !playerMgr.player || playerMgr.playerComp?.state != roleState.normal) {
            return false;
        }

        let matrixCenterX = playerMgr.player.position.x + matrixOffsetPos.x;
        let matrixCenterY = playerMgr.player.position.y + matrixOffsetPos.y;
        let halfWidth = matrixWidth / 2;
        let halfHeight = matrixHeight / 2;
        let edgeOffset = 0.001;
        let playerLeft = matrixCenterX - halfWidth;
        let playerRight = matrixCenterX + halfWidth;
        let playerTop = matrixCenterY + halfHeight;
        let playerBottom = matrixCenterY - halfHeight;
        let tileLeft = this.getTileLeftByTileX(tilePos.x);
        let tileRight = this.getTileRightByTileX(tilePos.x);
        let tileTop = this.getTileTopByTileY(tilePos.y);
        let tileBottom = this.getTileBottomByTileY(tilePos.y);

        return playerRight > tileLeft + edgeOffset
            && playerLeft < tileRight - edgeOffset
            && playerTop > tileBottom + edgeOffset
            && playerBottom < tileTop - edgeOffset;
    }

    /**通过本地坐标x获取瓦片索引 */
    private getTileXByNodeX(nodeX: number) {
        return Math.floor((nodeX + pData.mapHalfSize.x) / configData.tileSize);
    }

    /**通过本地坐标y获取瓦片索引 */
    private getTileYByNodeY(nodeY: number) {
        return Math.floor((pData.mapHalfSize.y - nodeY) / configData.tileSize);
    }

    /**通过瓦片x索引获取瓦片左边界的本地坐标 */
    private getTileLeftByTileX(tileX: number) {
        return tileX * configData.tileSize - pData.mapHalfSize.x;
    }

    /**通过瓦片x索引获取瓦片右边界的本地坐标 */
    private getTileRightByTileX(tileX: number) {
        return (tileX + 1) * configData.tileSize - pData.mapHalfSize.x;
    }

    /**通过瓦片y索引获取瓦片上边界的本地坐标 */
    private getTileTopByTileY(tileY: number) {
        return pData.mapHalfSize.y - tileY * configData.tileSize;
    }

    /**通过瓦片y索引获取瓦片下边界的本地坐标 */
    private getTileBottomByTileY(tileY: number) {
        return pData.mapHalfSize.y - (tileY + 1) * configData.tileSize;
    }

    /**限制矩形区域移动，默认检测宽20高25且比角色节点y坐标高8的矩形 */
    limitMoveMatrixPos(
        offsetPos: Vec3,
        matrixWidth = 20,
        matrixHeight = 25,
        matrixOffsetPos: Vec2 = this.defaultMoveMatrixOffset,
        moveNode: Node = playerMgr.player,
        moveTilePos: Vec2 = playerMgr.playerComp?.currentPos,
        blockRoomProps = false,
    ) {
        if (!moveNode || !moveTilePos) {
            return null;
        }
        // 复用成员向量，避免角色移动期间每帧创建临时坐标
        let limitPos = this.tempLimitedPlayerPos;
        limitPos.set(moveNode.position.x, moveNode.position.y, 0);
        let halfWidth = matrixWidth / 2;
        let halfHeight = matrixHeight / 2;
        let edgeOffset = 0.001;
        let currentTilePos = ccTools.getTileIndexByNodePos(moveNode.position, this.tempCurrentMoveTilePos);

        if (offsetPos.x != 0) {
            limitPos.x += offsetPos.x;

            let matrixCenterX = limitPos.x + matrixOffsetPos.x;
            let matrixCenterY = limitPos.y + matrixOffsetPos.y;
            let left = matrixCenterX - halfWidth;
            let right = matrixCenterX + halfWidth;
            let top = matrixCenterY + halfHeight;
            let bottom = matrixCenterY - halfHeight;
            let startTileY = this.getTileYByNodeY(top);
            let endTileY = this.getTileYByNodeY(bottom + edgeOffset);

            if (offsetPos.x > 0) {
                let checkTileX = this.getTileXByNodeX(right - edgeOffset);
                for (let y = startTileY; y <= endTileY; y++) {
                    //为true就是不可走
                    if (this.isBlockTileForMove(checkTileX, y, currentTilePos, blockRoomProps)) {
                        limitPos.x = this.getTileLeftByTileX(checkTileX) - halfWidth - matrixOffsetPos.x;
                        break;
                    }
                }
            } else {
                let checkTileX = this.getTileXByNodeX(left);
                for (let y = startTileY; y <= endTileY; y++) {
                    if (this.isBlockTileForMove(checkTileX, y, currentTilePos, blockRoomProps)) {
                        limitPos.x = this.getTileRightByTileX(checkTileX) + halfWidth - matrixOffsetPos.x;
                        break;
                    }
                }
            }
        }

        if (offsetPos.y != 0) {
            limitPos.y += offsetPos.y;

            let matrixCenterX = limitPos.x + matrixOffsetPos.x;
            let matrixCenterY = limitPos.y + matrixOffsetPos.y;
            let left = matrixCenterX - halfWidth;
            let right = matrixCenterX + halfWidth;
            let top = matrixCenterY + halfHeight;
            let bottom = matrixCenterY - halfHeight;
            let startTileX = this.getTileXByNodeX(left);
            let endTileX = this.getTileXByNodeX(right - edgeOffset);

            if (offsetPos.y > 0) {
                let checkTileY = this.getTileYByNodeY(top);
                for (let x = startTileX; x <= endTileX; x++) {
                    if (this.isBlockTileForMove(x, checkTileY, currentTilePos, blockRoomProps)) {
                        limitPos.y = this.getTileBottomByTileY(checkTileY) - halfHeight - matrixOffsetPos.y;
                        break;
                    }
                }
            } else {
                let checkTileY = this.getTileYByNodeY(bottom + edgeOffset);
                for (let x = startTileX; x <= endTileX; x++) {
                    if (this.isBlockTileForMove(x, checkTileY, currentTilePos, blockRoomProps)) {
                        limitPos.y = this.getTileTopByTileY(checkTileY) + halfHeight - matrixOffsetPos.y;
                        break;
                    }
                }
            }
        }

        ccTools.getTileIndexByNodePos(limitPos, this.tempCurrentMoveTilePos);
        moveTilePos.set(this.tempCurrentMoveTilePos);
        return limitPos;
    }

    /**检测人物坐标事件 */
    checkPlayerPos() {
        if (playerMgr.playerComp?.state == roleState.bed) {
            this.recycleAllGuideArrows();
            this.refreshBedGuideVisible(false);
            this.opratePos = null;
            this.oprateBtn.active = false;
            return;
        }

        this.recycleGuideArrowByTilePos(playerMgr.playerComp?.currentPos);

        let roomIdx = this.tileMap[playerMgr.playerComp.currentPos.x][playerMgr.playerComp.currentPos.y].roomIdx;
        let showOprateBtn = false;
        let showBedGuide = false;
        this.opratePos = null;
        this.oprateAction = "operate";

        let opetateLab = this.oprateBtn.getChildByName("lab").getComponent(Label);
        let pickPropsTile = this.getPickableRandomPropsTile(playerMgr.playerComp.currentPos);
        if (!this.carriedRandomProps && pickPropsTile) {
            opetateLab.string = "拾取";
            showOprateBtn = true;
            this.opratePos = new Vec2(playerMgr.playerComp.currentPos.x, playerMgr.playerComp.currentPos.y);
            this.oprateAction = "pickup";
        }

        if (roomIdx) {
            //检测在房间的道具
            let data: roomData = this.roomMap[roomIdx];
            let bedPos = null;
            let doorPos = null;
            //门是否关闭
            let isClose = false;

            let prePos = new Vec2(playerMgr.playerComp.currentPos.x, playerMgr.playerComp.currentPos.y);
            //遍历周围九宫格，检测是否有障碍物
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    prePos.set(playerMgr.playerComp.currentPos.x + i, playerMgr.playerComp.currentPos.y + j);
                    if (!this.tileMap[prePos.x][prePos.y].item || !this.tileMap[prePos.x][prePos.y].item.propsItem || !this.tileMap[prePos.x][prePos.y].item.propsItem.isValid) {
                        continue;
                    }
                    if (prePos.x == data.doorPos.x && prePos.y == data.doorPos.y) {
                        doorPos = new Vec2(prePos);
                        let comp = this.tileMap[prePos.x][prePos.y].item.propsComp as doorProps;
                        isClose = comp.isClose;
                    }
                    if (prePos.x == data.bedPos.x && prePos.y == data.bedPos.y) {
                        let bedComp = this.tileMap[prePos.x][prePos.y].item.propsComp as bedProps;
                        if (bedComp && !bedComp.isOccupied) {
                            bedPos = new Vec2(prePos);
                        }
                    }
                }
            }

            //按照优先级检测道具
            if (showOprateBtn) {
                //已检测到优先级更高的操作
            } else if (bedPos) {
                //检测床
                opetateLab.string = "上床";
                showOprateBtn = true;
                showBedGuide = true;
                this.opratePos = bedPos;
            } else if (doorPos && !isClose) {
                //检测没关的门
                opetateLab.string = "关门";
                showOprateBtn = true;
                this.opratePos = doorPos;
            } else if (doorPos && isClose) {
                //检测关的门
                opetateLab.string = "开门";
                showOprateBtn = true;
                this.opratePos = doorPos;
            }
        }

        if (showOprateBtn && this.opratePos) {
            this.updateOprateBtnPos(this.opratePos, this.oprateAction == "pickup" ? this.pickupBtnScreenOffsetY : null);
        }
        this.refreshBedGuideVisible(showBedGuide);
        this.oprateBtn.active = showOprateBtn;
    }

    /**刷新引导关上床按钮的引导动画 */
    private refreshBedGuideVisible(show: boolean) {
        let shouldShow = pData.isGuide && show;
        if (!this.bedGuideNode) {
            return;
        }

        if (shouldShow) {
            this.bedGuideNode.active = true;
            if (!this.isBedGuidePlaying && this.bedGuideSkeleton?.skeletonData) {
                this.bedGuideSkeleton.setAnimation(0, "animation", true);
                this.isBedGuidePlaying = true;
            }
            return;
        }

        if (!this.bedGuideNode.active && !this.isBedGuidePlaying) {
            return;
        }

        this.bedGuideNode.active = false;
        this.bedGuideSkeleton?.clearTracks();
        this.isBedGuidePlaying = false;
    }

    /**获取脚下可拾取的随机道具瓦片 */
    private getPickableRandomPropsTile(tilePos: Vec2) {
        let tileItem = this.tileMap[tilePos.x]?.[tilePos.y]?.item;
        if (!tileItem || !tileItem.isRandomPickProps || !tileItem.propsItem || !tileItem.propsItem.isValid) {
            return null;
        }

        return tileItem;
    }

    /**根据地图瓦片位置更新操作按钮在UI层的位置 */
    private updateOprateBtnPos(tilePos: Vec2, screenOffsetY: number = null) {
        if (!this.gameCamera || !this.UINode) {
            return;
        }

        let tileItem = this.tileMap[tilePos.x]?.[tilePos.y]?.item;
        if (tileItem) {
            tileItem.node.getWorldPosition(this.tempTileCenterWorldPos);
        } else {
            this.tempTileCenterWorldPos.set(ccTools.getPosByTileIndex(tilePos));
        }

        playerMgr.player.getWorldPosition(this.tempPlayerWorldPos);

        this.gameCamera.worldToScreen(this.tempPlayerWorldPos, this.tempPlayerScreenPos);
        this.gameCamera.worldToScreen(this.tempTileCenterWorldPos, this.tempScreenPos);

        if (screenOffsetY != null) {
            this.tempScreenPos.y += screenOffsetY;
        } else {
            let screenDirX = this.tempScreenPos.x - this.tempPlayerScreenPos.x;
            let screenDirY = this.tempScreenPos.y - this.tempPlayerScreenPos.y;
            let screenDirLength = Math.sqrt(screenDirX * screenDirX + screenDirY * screenDirY);
            if (screenDirLength <= 0) {
                screenDirX = 1;
                screenDirY = 0;
                screenDirLength = 1;
            }

            this.tempScreenPos.x += screenDirX / screenDirLength * 60;
            this.tempScreenPos.y += screenDirY / screenDirLength * 60;
        }

        let uiTransform = this.UINode.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        if (this.uiCamera) {
            this.uiCamera.screenToWorld(this.tempScreenPos, this.tempUIWorldPos);
            uiTransform.convertToNodeSpaceAR(this.tempUIWorldPos, this.tempUILocalPos);
        } else {
            uiTransform.convertToNodeSpaceAR(this.tempScreenPos, this.tempUILocalPos);
        }

        this.oprateBtn.setPosition(this.tempUILocalPos);
    }

    /**获取瓦片中心点的世界坐标 */
    private getTileCenterWorldPos(tilePos: Vec2, out: Vec3) {
        this.tempTileCenterLocalPos.set(ccTools.getPosByTileIndex(tilePos));

        let mapTransform = this.tiledMap?.node?.getComponent(UITransform);
        if (mapTransform) {
            mapTransform.convertToWorldSpaceAR(this.tempTileCenterLocalPos, out);
        } else {
            out.set(this.tempTileCenterLocalPos);
        }
    }

    /**关闭触摸点和界面 */
    private closeTouchSelect() {
        this.touchSelect.active = false;
        uiMgr.closePage(UIPath.UIBuild);
        uiMgr.closePage(UIPath.UIProps);
    }

    /**根据地图瓦片位置更新触摸选择节点在UI层的位置 */
    private updateTouchSelectPos(tilePos: Vec2) {
        if (!this.gameCamera || !this.UINode || !this.touchSelect) {
            return;
        }

        this.getTileCenterWorldPos(tilePos, this.tempTileCenterWorldPos);
        this.gameCamera.worldToScreen(this.tempTileCenterWorldPos, this.tempScreenPos);

        let uiTransform = this.UINode.getComponent(UITransform);
        if (!uiTransform) {
            return;
        }

        if (this.uiCamera) {
            this.uiCamera.screenToWorld(this.tempScreenPos, this.tempUIWorldPos);
            uiTransform.convertToNodeSpaceAR(this.tempUIWorldPos, this.tempUILocalPos);
        } else {
            uiTransform.convertToNodeSpaceAR(this.tempScreenPos, this.tempUILocalPos);
        }

        this.touchSelect.setPosition(this.tempUILocalPos);
        this.touchSelect.active = true;


        //道具处理
        let tileItem: tileItemController = this.tileMap[tilePos.x]?.[tilePos.y]?.item;
        if (tileItem && tileItem.propsItem) {
            let propComp = tileItem.propsComp;
            if (tileItem.isGrayTile) {
                uiMgr.openPage(UIPath.UIProps, { pos: this.tempUILocalPos, tilePos: tilePos, propsComp: propComp, isGrayProps: true });
            } else if (propComp.isMaxLevel && propComp.propsType == tilePropsType.bed) {
                uiMgr.showTips("已达最大等级");
            } else {
                uiMgr.openPage(UIPath.UIProps, { pos: this.tempUILocalPos, tilePos: tilePos, propsComp: propComp });
            }
        } else {
            let guideBuildPropsType = this.getGuideBuildPropsType(tilePos);
            uiMgr.openPage(UIPath.UIBuild, {
                pos: this.tempUILocalPos,
                tilePos: tilePos,
                roomData: this.getBuildRoomData(tilePos),
                guideBuildPropsType: guideBuildPropsType,
                gameComp: this,
            });
        }
    }

    /**获取触摸点所在地图瓦片 */
    private getTouchTilePos(event: EventTouch) {
        if (!this.gameCamera) {
            return null;
        }

        let visibleSize = view.getVisibleSize();
        if (visibleSize.width <= 0 || visibleSize.height <= 0) {
            return null;
        }

        let touchPos = event.getUILocation();
        let worldPerPixel = this.gameCamera.orthoHeight * 2 / visibleSize.height;
        this.gameCamera.node.getWorldPosition(this.tempCameraWorldPos);
        this.tempTouchWorldPos.set(
            this.tempCameraWorldPos.x + (touchPos.x - visibleSize.width / 2) * worldPerPixel,
            this.tempCameraWorldPos.y + (touchPos.y - visibleSize.height / 2) * worldPerPixel,
            0
        );

        let mapTransform = this.tiledMap?.node?.getComponent(UITransform);
        if (mapTransform) {
            mapTransform.convertToNodeSpaceAR(this.tempTouchWorldPos, this.tempTouchMapLocalPos);
        } else {
            this.tempTouchMapLocalPos.set(this.tempTouchWorldPos);
        }

        let tilePos = ccTools.getTileIndexByNodePos(this.tempTouchMapLocalPos);
        if (tilePos.x < 0 || tilePos.y < 0 || tilePos.x >= pData.mapSize.width || tilePos.y >= pData.mapSize.height) {
            return null;
        }

        return tilePos;
    }

    protected update(dt: number): void {
        if (this.isGamePause) {
            return;
        }

        this.refreshGameStartElapsedTime(dt);
        this.refreshRobotSuchRoomDelay(dt);
        this.refreshRepairMask(dt);
        this.refreshSkillNode(dt);
        this.refreshRoleBtnAttackStateByInterval(dt);

        // 移动玩家（不使用vec3计算）
        if (this.isEnemyMode) {
            if (this.isEnemyCameraFollowing && this.controlledEnemy?.node) {
                this.gameCameraComp?.setCameraPos(this.controlledEnemy.node.position);
            }
            if (this.isMoving) {
                this.controlledEnemy?.moveByPlayerInput(this.currentMoveDirection, dt);
            }
        } else if (this.isMoving && playerMgr.playerComp?.state == roleState.normal && !playerMgr.playerComp.isMoveLocked) {
            let speed = this.isEnemyCanMove ? configData.moveSpeedGame : configData.moveSpeed;
            playerMgr.playerComp?.playRoleAnim(roleAnimName.move, true);
            //玩家移动
            this.tempPlayerMoveOffset.set(this.currentMoveDirection.x * speed * dt, this.currentMoveDirection.y * speed * dt, 0);
            let playerPos = this.limitMoveMatrixPos(this.tempPlayerMoveOffset);

            let roleAnimNode = playerMgr.playerComp?.roleAnim?.node;
            //人物左右反向
            if (roleAnimNode) {
                roleAnimNode.setScale(this.currentMoveDirection.x < 0 ? -1 : 1, 1, 1);
            }
            playerMgr.player.setPosition(playerPos);

            this.refreshPlayerRoomChange();

            //检测人物坐标事件
            this.checkPlayerPos();
        }

        this.refreshPendingDoorBlocks();
    }

    /**刷新倒计时结束后的游戏经过时间 */
    private refreshGameStartElapsedTime(dt: number) {
        if (!this.isGameStartCountDownEnd) {
            return;
        }

        this.gameStartElapsedTime += dt;
    }

    /**刷新机器人寻找房间延迟 */
    private refreshRobotSuchRoomDelay(dt: number) {
        if (this.robotSuchRoomDelayMap.size == 0) {
            return;
        }

        for (let [robotComp, delayTime] of this.robotSuchRoomDelayMap) {
            if (!robotComp?.node?.isValid) {
                this.robotSuchRoomDelayMap.delete(robotComp);
                continue;
            }

            delayTime = Math.max(0, delayTime - dt);
            if (delayTime <= 0) {
                this.robotSuchRoomDelayMap.delete(robotComp);
                robotComp.suchRoom();
                continue;
            }

            this.robotSuchRoomDelayMap.set(robotComp, delayTime);
        }
    }

    /**房门受到敌人攻击 */
    onDoorAttackedByEnemy(tilePos: Vec2, damagePercent: number = 0) {
        if (!tilePos || !this.isGameStartCountDownEnd) {
            return;
        }

        this.onGuidePlayerDoorAttacked(tilePos);
        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        let robotComp = this.getSleepingRobotInRoom(roomIdx);
        if (roomIdx <= 0 || !robotComp) {
            return;
        }

        if (this.gameStartElapsedTime > robotCommonConfig.enemyAttackTimeThreshold) {
            robotComp.tryHandleDoorAttackLater(damagePercent);
            return;
        }

        robotComp.tryUpgradeDoorByEnemyAttack();
    }

    /**敌人开始攻击房门 */
    onDoorAttackStartedByEnemy(tilePos: Vec2) {
        if (!tilePos || !this.isGameStartCountDownEnd) {
            return;
        }

        let attackKey = this.getTilePosKey(tilePos);
        let attackerCount = this.doorAttackerCountMap[attackKey] || 0;
        this.doorAttackerCountMap[attackKey] = attackerCount + 1;
        if (attackerCount > 0) {
            return;
        }

        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        let robotComp = this.getSleepingRobotInRoom(roomIdx);
        if (roomIdx <= 0 || !robotComp) {
            return;
        }

        robotComp.onDoorAttackStart();
    }

    /**敌人停止攻击房门 */
    onDoorAttackStoppedByEnemy(tilePos: Vec2) {
        if (!tilePos) {
            return;
        }

        let attackKey = this.getTilePosKey(tilePos);
        let attackerCount = this.doorAttackerCountMap[attackKey] || 0;
        if (attackerCount <= 0) {
            return;
        }
        if (attackerCount > 1) {
            this.doorAttackerCountMap[attackKey] = attackerCount - 1;
            return;
        }

        delete this.doorAttackerCountMap[attackKey];
        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        this.getSleepingRobotInRoom(roomIdx)?.onDoorAttackEnd();
    }

    /**修改地图内的行走区域 */
    fixTileMapBlock(pos, flag) {
        let tileData = this.tileMap[pos.x]?.[pos.y];
        if (!tileData) {
            return;
        }

        let key = this.getTilePosKey(pos);
        if (flag != 1) {
            delete this.pendingDoorBlockPosMap[key];
            tileData.block = flag;
            return;
        }

        if (this.isPlayerMoveMatrixOverlappingTile(pos)) {
            tileData.block = 0;
            this.pendingDoorBlockPosMap[key] = new Vec2(pos.x, pos.y);
            return;
        }

        delete this.pendingDoorBlockPosMap[key];
        tileData.block = 1;
    }

    /**玩家完全离开门格后，再把已关闭的门恢复为不可行走 */
    private refreshPendingDoorBlocks() {
        for (let key in this.pendingDoorBlockPosMap) {
            let pos = this.pendingDoorBlockPosMap[key];
            let tileData = this.tileMap[pos.x]?.[pos.y];
            let doorComp = tileData?.item?.propsComp as doorProps;
            if (!tileData || !doorComp || !doorComp.isClose) {
                delete this.pendingDoorBlockPosMap[key];
                continue;
            }

            if (this.isPlayerMoveMatrixOverlappingTile(pos)) {
                continue;
            }

            tileData.block = 1;
            delete this.pendingDoorBlockPosMap[key];
        }
    }

    /**生成瓦片坐标键 */
    private getTilePosKey(pos: Vec2) {
        return `${pos.x}_${pos.y}`;
    }

    /**关闭指定房间的门 */
    closeDoorByRoom(roomId: number) {
        let doorTile = this.getDoorByRoom(roomId);
        if (doorTile && !doorTile.isClose) {
            doorTile.tileItemComp.operateProps();
        }

        thornProps.refreshRoomDoorEffect(this, roomId);
        iceProps.refreshRoomDoorIceEffect(this, roomId);
    }

    /**获取瓦片所在房间 */
    private getRoomIdxByTilePos(tilePos: Vec2) {
        if (!tilePos) {
            return 0;
        }

        return this.tileMap[tilePos.x]?.[tilePos.y]?.roomIdx || 0;
    }

    /**获取建造界面需要的当前房间数据 */
    private getBuildRoomData(tilePos: Vec2) {
        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return null;
        }

        let propsCountMap: { [key: string]: number } = {};
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let pos = roomArr[i];
            let propsType = this.tileMap[pos.x]?.[pos.y]?.item?.propsComp?.propsType;
            if (!propsType) {
                continue;
            }

            propsCountMap[propsType] = (propsCountMap[propsType] || 0) + 1;
        }

        return {
            roomArr: roomData.roomArr,
            doorPos: roomData.doorPos,
            bedPos: roomData.bedPos,
            propsCountMap: propsCountMap,
        };
    }

    /**刷新玩家进出房间状态，离开房间后自动关门 */
    private refreshPlayerRoomChange() {
        let curRoomIdx = this.getRoomIdxByTilePos(playerMgr.playerComp?.currentPos);
        if (this.playerLastRoomIdx > 0 && curRoomIdx != this.playerLastRoomIdx && this.hasSleepingRoleInRoom(this.playerLastRoomIdx)) {
            this.closeDoorByRoom(this.playerLastRoomIdx);
        }

        this.playerLastRoomIdx = curRoomIdx;
        if (playerMgr.playerComp && playerMgr.playerComp.state != roleState.bed) {
            playerMgr.playerComp.roomIdx = curRoomIdx > 0 ? curRoomIdx : -1;
        }
        this.refreshRepairBtnVisible();
    }

    /**房间床是否已被占用 */
    hasSleepingRoleInRoom(roomId: number) {
        let roomData: roomData = this.roomMap[roomId];
        let bedPos = roomData?.bedPos;
        if (!bedPos) {
            return false;
        }

        let bedComp = this.tileMap[bedPos.x]?.[bedPos.y]?.item?.propsComp as bedProps;
        return !!bedComp && bedComp.isOccupied;
    }

    /**获取房间内正在睡觉的人机 */
    private getSleepingRobotInRoom(roomId: number) {
        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            if (robotComp && robotComp.roleId != 0 && robotComp.roomIdx == roomId && robotComp.state == roleState.bed) {
                return robotComp;
            }
        }

        return null;
    }

    /**获取指定房间的门 */
    private getDoorByRoom(roomId: number): doorProps {
        let roomData = this.roomMap[roomId];
        if (!roomData || !roomData.doorPos) {
            return null;
        }

        let doorPos = roomData.doorPos;
        let tileComp = this.tileMap[doorPos.x]?.[doorPos.y]?.item;
        return tileComp?.propsComp as doorProps;
    }

    /**玩家上床回调 */
    playerToBedCall() {
        if (pData.isGuide && this.hasReportedEnterBedGuideStart && !this.hasReportedEnterBedGuideFinish) {
            if (gm.hgSdk) {
                gm.hgSdk.track('TUTORIAL_FINISH', {});
            }
            this.hasReportedEnterBedGuideFinish = true;
        }
        this.recycleAllGuideArrows();
        playerMgr.cameraFollow = false;
        this.rockerTouchNode.active = false;
        this.slideTouchNode.active = true;

        let data: roomData = this.roomMap[playerMgr.playerComp.roomIdx];
        if (!data || !data.roomArr) {
            return;
        }

        this.placeCarriedRandomPropsInRoom(playerMgr.playerComp.roomIdx);

        //将除了门和床以外的道具节点增加进地图并打开可选框
        for (let i = 0; i < data.roomArr.length; i++) {
            let tilePos = data.roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            if (!tileData) {
                continue;
            }

            let tileComp = tileData.item;
            if (!tileComp) {
                tileComp = this.createTileItem(tilePos, playerMgr.playerComp.roomIdx);
            } else {
                let type = tileComp.tileType;
                if (type == tilePropsType.door) {
                    //关门
                    let doorTile: doorProps = tileComp?.propsComp as doorProps;
                    if (doorTile && !doorTile.isClose) {
                        tileComp.operateProps();
                    }
                } else if (type == tilePropsType.bed) {
                    let bedTile: bedProps = tileComp?.propsComp as bedProps;
                    bedTile.showRole(playerMgr.playerComp.skinId);
                    //玩家需要到床上
                    playerMgr.playerComp.currentPos = new Vec2(tileComp.pos.x, tileComp.pos.y);
                    playerMgr.player.setPosition(tileComp.node.position);
                }
            }

            tileComp.showSelectBox();
        }

        playerMgr.playerComp.hideRole();
        thornProps.refreshRoomDoorEffect(this, playerMgr.playerComp.roomIdx);
        iceProps.refreshRoomDoorIceEffect(this, playerMgr.playerComp.roomIdx);
        this.refreshDoorMachineEffect(playerMgr.playerComp.roomIdx);
    }

    /**刷新指定房间门上的维修台效果 */
    refreshDoorMachineEffect(roomIdx: number) {
        doorProps.refreshRoomMachineRepairEffect(this, roomIdx);
    }

    /**玩家占用房间后，刷新预定该房间的人机目标 */
    private refreshRobotTargetByPlayerRoom(roomIdx: number) {
        if (roomIdx <= 0) {
            return;
        }

        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            robotComp?.refreshTargetRoomByOccupiedRoom(roomIdx);
        }
    }

    /**随机道具被拾取后，刷新预定该道具的人机目标 */
    private refreshRobotTargetByRandomProps(tilePos: Vec2, pickupRobotId: number) {
        if (!tilePos) {
            return;
        }

        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            if (!robotComp || robotComp.roleId == pickupRobotId) {
                continue;
            }

            robotComp.refreshTargetRandomPropsByPicked(tilePos);
        }
    }

    /**添加生产动画 */
    addProduceAnim(type: produceType, num: number, worldPos: Vec3) {
        let tipsNode = poolMgr.getProduceTipsNode(uiMgr.produceTipsPrefab);
        this.gameUINode.addChild(tipsNode);
        let localPos = this.gameUINode.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        tipsNode.position = localPos;
        let comp = tipsNode.getComponent(produceTips);
        comp.initNum(type, num);
    }

    /**刷新游戏货币显示 */
    refreshMonetaryLab() {
        this.coinLab.string = pData.gameCoin.toString();
        this.powerLab.string = pData.gamePower.toString();
        this.refreshGuideUpgradeGuide();
        this.refreshGuideCannonBuildGuide();
        this.refreshGuideGeneratorBuildGuide();
    }

    /**摇杆区域点击开始 */
    onTouchRockerStart(event: EventTouch) {
        let rockerNode = this.rockerTouchNode.getChildByName("rockerNode");
        let rockerPoint = rockerNode.getChildByName("rockerPoint");

        this.currentMoveDirection.set(0, 0, 0);
        let worldPos = event.getUILocation();
        this.tempTouchWorldPos.set(worldPos.x, worldPos.y, 0);
        this.rockerTouchNode.getComponent(UITransform).convertToNodeSpaceAR(this.tempTouchWorldPos, this.tempTouchMapLocalPos);
        rockerNode.setPosition(this.tempTouchMapLocalPos);
        rockerPoint.position = Vec3.ZERO;
    }

    /**摇杆区域移动 */
    onTouchRockerMove(event: EventTouch) {
        const maxDistance = 86;
        const moveMultiplier = 4; // 移动倍数，可以根据需要调整
        let rockerNode = this.rockerTouchNode.getChildByName("rockerNode");
        let rockerPoint = rockerNode.getChildByName("rockerPoint");

        let worldPos = event.getUILocation();
        this.tempTouchWorldPos.set(worldPos.x, worldPos.y, 0);
        rockerNode.getComponent(UITransform).convertToNodeSpaceAR(this.tempTouchWorldPos, this.tempTouchMapLocalPos);

        let directionX = this.tempTouchMapLocalPos.x;
        let directionY = this.tempTouchMapLocalPos.y;
        // 直接使用数值计算方向与限位，避免触摸移动时反复clone Vec3
        let directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        let extendedLength = directionLength * moveMultiplier;
        let currentRatio = Math.min(extendedLength / maxDistance, 1);
        let normalizeScale = directionLength > 0 ? 1 / directionLength : 0;
        let clampedScale = directionLength > 0 ? Math.min(moveMultiplier, maxDistance / directionLength) : 0;

        this.isMoving = true;
        this.currentMoveDirection.set(directionX * normalizeScale * currentRatio, directionY * normalizeScale * currentRatio, 0);

        // 设置摇杆点的位置
        rockerPoint.setPosition(directionX * clampedScale, directionY * clampedScale, 0);
    }

    /**摇杆区域点击结束 */
    onTouchRockerEnd(event: any) {
        this.rockerReset();
    }

    /**滑动区域点击开始 */
    onTouchSlideStart(event: EventTouch) {
        let touchPos = event.getUILocation();
        this.slideStartUILocation.set(touchPos.x, touchPos.y);
        this.slideLastUILocation.set(touchPos.x, touchPos.y);
        this.isSlideMoving = false;
    }

    /**滑动区域移动 */
    onTouchSlideMove(event: EventTouch) {
        if (!this.gameCameraComp) {
            return;
        }

        let touchPos = event.getUILocation();
        if (!this.isSlideMoving) {
            let startDeltaX = touchPos.x - this.slideStartUILocation.x;
            let startDeltaY = touchPos.y - this.slideStartUILocation.y;
            //移动不超过10像素不算移动
            if (startDeltaX * startDeltaX + startDeltaY * startDeltaY <= 100) {
                return;
            }

            this.isSlideMoving = true;
            this.closeTouchSelect();
        }

        this.tempSlideDelta.set(touchPos.x - this.slideLastUILocation.x, touchPos.y - this.slideLastUILocation.y);
        this.slideLastUILocation.set(touchPos.x, touchPos.y);
        this.gameCameraComp.moveCameraByScreenDelta(this.tempSlideDelta);
    }

    /**滑动区域点击结束 */
    onTouchSlideEnd(event: EventTouch) {
        if (!this.isSlideMoving) {
            if (playerMgr.playerComp?.state != roleState.bed) {
                return;
            }

            let touchTilePos = this.getTouchTilePos(event);
            this.closeTouchSelect();
            if (!touchTilePos) {
                return;
            }

            let playerRoomIdx = playerMgr.playerComp.roomIdx;
            if (playerRoomIdx <= 0) {
                let playerTilePos = playerMgr.playerComp.currentPos;
                playerRoomIdx = this.tileMap[playerTilePos.x]?.[playerTilePos.y]?.roomIdx || 0;
            }

            let touchRoomIdx = this.tileMap[touchTilePos.x]?.[touchTilePos.y]?.roomIdx || 0;
            if ((touchRoomIdx > 0 && touchRoomIdx == playerRoomIdx) || this.canClickGrayTeamProps(touchTilePos, playerRoomIdx)) {
                this.selectedPos.set(touchTilePos);
                this.updateTouchSelectPos(touchTilePos);
            }
        }
    }

    /**是否可以点击队友已摧毁房间内的置灰道具 */
    private canClickGrayTeamProps(tilePos: Vec2, playerRoomIdx: number) {
        let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
        let tileItem = tileData?.item;
        if (!tileItem || !tileItem.isGrayTile || !tileItem.propsItem || !tileItem.propsItem.isValid) {
            return false;
        }

        let roomIdx = tileData.roomIdx || tileItem.roomIdx;
        return roomIdx > 0 && roomIdx != playerRoomIdx;
    }

    /**刷新游戏摄像机视角 */
    refreshGameCamera() {
        this.updateGameToUICameraScale();
        let uitrans = this.touchSelect.getComponent(UITransform);
        uitrans.setContentSize(configData.tileSize * this.gameToUICameraScale, configData.tileSize * this.gameToUICameraScale);
    }

    /**定位到敌人视角 */
    lookAtEnemy() {
        if (playerMgr.playerComp?.state != roleState.bed) {
            return;
        }

        if (!this.gameCameraComp) {
            return;
        }

        for (let i = 0; i < enemyMgr.enemyArr.length; i++) {
            let enemyComp = enemyMgr.enemyArr[i];
            if (!enemyComp || !enemyComp.node || !enemyComp.node.isValid || enemyComp.hp <= 0) {
                continue;
            }

            playerMgr.cameraFollow = false;
            this.gameCameraComp.setCameraPos(enemyComp.node.getPosition(), true);
            return;
        }

        uiMgr.showTips("没有可定位的敌人");
    }

    /**铡刀触发后定位敌人并锁定本局视角 */
    lockCameraAtSawTarget(enemyComp: enemyBaseController) {
        if (this.isCameraLockedBySaw || !this.gameCameraComp
            || !enemyComp?.node || !enemyComp.node.isValid) {
            return;
        }

        this.isCameraLockedBySaw = true;
        playerMgr.cameraFollow = false;
        this.gameCameraComp.lockCameraPos(enemyComp.node.getPosition());
    }

    /**增加游戏内货币 */
    addGameMonetary(num = 1000000) {
        pData.fixGameCoin(num);
        pData.fixGamePower(num);
    }

    /**强制开始游戏 */
    forceStartGame() {
        this.stopGameCountDown();
        this.timeNode.active = false;

        if (this.isGameStartCountDownEnd) {
            return;
        }

        this.gameStartCountDownTime = 0;
        this.countDownEnd();
    }

    ///
    ///点击函数
    ///

    /**监听按钮点击事件 */
    onKeyDown(event: EventKeyboard) {
        if (!gm.isDebug) {
            return;
        }
        switch (event.keyCode) {
            case KeyCode.KEY_S:
                //强制开始游戏
                this.forceStartGame();
                break;
            case KeyCode.KEY_D:
                //弹出胜利界面
                uiMgr.openPage(UIPath.UISuccess, {
                    skinId: pData.skinId,
                    survivalTime: this.getGameStartElapsedTime(),
                });
                break;
            case KeyCode.KEY_F:
                //弹出失败界面
                uiMgr.openPage(UIPath.UIFail, {
                    enemySkinId: enemyMgr.enemyArr[0]?.skinId || 0,
                    survivalTime: this.getGameStartElapsedTime(),
                });
                break;
            case KeyCode.KEY_L:
                //增加游戏内货币
                this.addGameMonetary();
                break;
            case KeyCode.KEY_E:
                //定位到敌人视角
                this.lookAtEnemy();
                break;
            case KeyCode.KEY_A:
                //增加通关次数
                pData.addLevel();
                break;
            case KeyCode.KEY_P:
                //打开控制台
                uiMgr.openPage(UIPath.UIConsole);
                break;
            case KeyCode.KEY_R:
                //重新开始游戏
                this.restartGame();
                break;
        }
    }

    /**点击操作按钮 */
    clickOprateBtn() {
        if (!this.opratePos) {
            console.warn("没有操作目标");
            return;
        }

        let tileItem: tileItemController = this.tileMap[this.opratePos.x][this.opratePos.y].item;
        if (!tileItem) {
            console.warn("没有找到操作道具");
            return;
        }

        if (this.oprateAction == "pickup") {
            this.pickupRandomProps(tileItem);
            this.checkPlayerPos();
            return;
        }

        //操作道具
        tileItem.operateProps();

        if (tileItem.tileType == tilePropsType.bed) {
            playerMgr.playerComp.roomIdx = tileItem.roomIdx;
            //床需要操作玩家
            this.playerToBedCall();
            this.refreshRobotTargetByPlayerRoom(playerMgr.playerComp.roomIdx);
            this.refreshRepairBtnVisible();
            //金币补偿
            let offset = enemyCommonConfig.enemyStartTime - this.gameStartCountDownTime;
            pData.fixGameCoin(offset);
            this.checkPlayerPos();
            return;
        }

        this.checkPlayerPos();
    }

    /**点击角色定位按钮 */
    clickRoleBtn(roleId: number) {
        if (this.isEnemyMode) {
            return;
        }
        if (!playerMgr.playerComp || playerMgr.playerComp.roomIdx <= 0) {
            return;
        }

        let roleComp = this.getRoleCompById(roleId);
        if (!roleComp || !roleComp.node) {
            return;
        }

        this.gameCameraComp.setCameraPos(roleComp.node.getPosition(), true);
    }

    /**点击设置按钮 */
    clickSetBtn() {
        uiMgr.openPage(UIPath.UISetting, { mode: 1 });
        gm.gamePause();
    }

    /**点击修复按钮 */
    clickRepairBtn() {
        if (playerMgr.playerComp.roomIdx <= 0) {
            console.warn("没有进入房间");
            return;
        }

        if (this.repairCoolDownTime > 0) {
            return;
        }

        let doorTile = this.getDoorByRoom(playerMgr.playerComp.roomIdx);
        if (!doorTile) {
            console.warn("没有找到房间门");
            return;
        }

        doorTile.startRepairAdd(configData.repairTime);
        this.repairCoolDownTime = configData.repairCoolDown;
        this.repairMask.node.active = true;
        this.repairMask.fillRange = 1;
    }

    /**点击技能按钮 */
    clickSkillBtn(idx: number) {
        if (!this.isEnemyMode || !this.controlledEnemy) {
            return;
        }

        let skillConfig = this.getSkillConfig(idx);
        let enemyLevel = this.controlledEnemy.level + 1;
        if (!skillConfig) {
            return;
        }

        let unlockLevel = Number(skillConfig.quantity) || 0;
        if (enemyLevel < unlockLevel) {
            uiMgr.showTips(`等级达到${unlockLevel}后解锁`);
            return;
        }

        if (!this.isEnemyCanMove) {
            return;
        }

        let cooldownTime = Math.max(0, this.skillCoolDownTimes[idx] || 0);
        if (cooldownTime > 0) {
            let skillName = idx == 0 ? "狂暴" : idx == 1 ? "震慑" : "技能";
            uiMgr.showTips(`${skillName}技能冷却中，剩余${Math.ceil(cooldownTime)}秒`);
            return;
        }

        let isReleased = idx == 0
            ? this.controlledEnemy.usePlayerRageSkill()
            : idx == 1 && this.controlledEnemy.usePlayerFearSkill();
        if (!isReleased) {
            return;
        }

        this.skillCoolDownTimes[idx] = Math.max(0, Number(skillConfig.skillCooldownTime) || 0);
        this.refreshSkillNode();
    }
}

interface tileData {
    /**0:可走，1：障碍物（都不可走），2：道具（人物可以走） */
    block: number;
    /**道具节点 */
    item?: tileItemController;
    /**房间索引 */
    roomIdx?: number;
}

interface roomData {
    /**房间数组 */
    roomArr: Vec2[],
    doorPos: Vec2,
    bedPos: Vec2,
}

interface carriedRandomPropsData {
    propsType: tilePropsType,
    level: number,
    isSpecialSellProps: boolean,
    propsNode: Node,
    propsComp: any,
}

interface roleBtnStateData {
    roleBtn: Node,
    avatarNode: Node,
    avatarSprite: Sprite,
    attackNode: Node,
    redMaskOpacity: UIOpacity,
    isAttackAnimPlaying: boolean,
    needLoopAttackAnim: boolean,
    lastIsDead: boolean,
    lastIsRoomAttacked: boolean,
    baseAvatarPos: Vec3,
}
