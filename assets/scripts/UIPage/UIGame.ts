import { _decorator, Camera, Canvas, EventKeyboard, EventTouch, Input, input, instantiate, KeyCode, Label, Layout, Node, UITransform, Vec2, Vec3, NodeEventType, director, TiledMap, TiledObjectGroup, Prefab, view, Sprite, Tween, TiledMapAsset } from 'cc';
import { uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { UIBase } from './UIBase';
import { imgPath, ItemPath, mapNameArr, UIPath } from '../manager/pathConfig';
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
import { CameraController } from '../controller/CameraController';
import { roleAnimName, roleController, roleState } from '../controller/roleController';
import { enemyMgr } from '../manager/enemyManager';
import { enemyBaseController } from '../controller/enemy/enemyBaseController';
import { produceTips, produceType } from './tips/produceTips';
import { poolMgr } from '../manager/poolManager';
import { JsonPropsData, propsConfig } from '../json/jsonProps';
const { ccclass, property } = _decorator;

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

    ///
    ///需要获取的节点
    ///
    oprateBtn: Node = null;
    touchSelect: Node = null;

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
    private currentMoveDirection: Vec3 = Vec3.ZERO;
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
    /**机器人开始找房间剩余时间 */
    private robotSuchRoomDelayTime = 0;
    /**玩家上一帧所在房间 */
    private playerLastRoomIdx = 0;
    /**倒计时结束后的游戏经过时间 */
    private gameStartElapsedTime = 0;
    /**当前地图资源名称 */
    private currentMapName = "";
    /**游戏页打开序号，用于避免异步加载回写旧局 */
    private openVersion = 0;
    protected onLoad(): void {
        this.oprateBtn = this.UINode.getChildByName('oprateBtn');
        this.touchSelect = this.UINode.getChildByName('touchSelect');
        this.repairMask = this.repairBtn.getChildByName("mask").getComponent(Sprite);

        this.bindBtn();
        this.initCamera();
    }

    async onUI_Open(data?: any) {
        ++this.openVersion;
        this.addListener();
        this.restartGame();
    }

    onUI_Close(): void {
        this.openVersion++;
        this.removeListener();
    }

    /**随机并装配瓦片地图 */
    private async randomTiledMap() {
        if (!this.tiledMap || !uiMgr.resBundle || mapNameArr.length <= 0) {
            return false;
        }

        let randomIdx = Math.floor(Math.random() * mapNameArr.length);
        let mapName = mapNameArr[randomIdx];
        let mapAsset: TiledMapAsset = await ccResTools.loadTiledMap(uiMgr.resBundle, ItemPath.tileMap + mapName);
        if (!mapAsset) {
            return false;
        }

        this.currentMapName = mapName;
        this.tiledMap.tmxAsset = mapAsset;
        console.warn("----------->当前随机地图：", this.currentMapName);
        return true;
    }

    /**重新开始单局 */
    private async restartGame() {
        let version = this.openVersion;
        let mapReady = await this.randomTiledMap();
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
    }

    initCamera() {
        let gameCamera = this.node.getChildByName("gameCamera");
        this.gameCameraComp = gameCamera?.getComponent(CameraController);
        this.gameCamera = gameCamera?.getComponent(Camera);

        let canvas = director.getScene()?.getChildByName("Canvas")?.getComponent(Canvas);
        this.uiCamera = canvas?.cameraComponent;
    }

    initData() {
        pData.levelInit();

        /**清除数据 */
        this.clearData();

        this.rockerTouchNode.active = true;
        this.refreshMonetaryLab();

        this.initMapLayer();
        this.getMapObjectLayer();

        this.initRobot();
        this.initPlayer();
        this.initRoleBtnList();

        this.initEnemy();

        //TODO 暂时关闭倒计时
        this.startGameCountDown();

        //等待一段时间后，机器人开始房间寻找
        this.robotSuchRoomDelayTime = 2;
    }

    clearData() {
        this.unscheduleAllCallbacks();
        this.rockerTouchNode.active = false;
        this.slideTouchNode.active = false;
        this.oprateBtn.active = false;
        this.closeTouchSelect();
        this.timeNode.active = false;
        this.repairBtn.active = false;
        this.isGameStartCountDownEnd = false;
        this.isGamePause = false;
        this.repairCoolDownTime = 0;
        this.robotSuchRoomDelayTime = 0;
        this.playerLastRoomIdx = 0;
        this.gameStartElapsedTime = 0;
        Tween.stopAllByTarget(this.repairMask);
        this.repairMask.fillRange = 0;
        this.repairMask.node.active = false;

        this.stopGameCountDown();

        this.recycleAllTileItems();
        ccTools.destroyAllChild(this.roleNode);
        ccTools.destroyAllChild(this.roleBtnLayout);

        //TODO 后续加入对象池管理
        playerMgr.player = null;
        enemyMgr.enemyArr = [];
        enemyMgr.enemyId = 0;
        enemyMgr.enemyBornPosArr = [];
        this.robotArr = [];
        this.roomMap = {};
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
        console.warn("----------->地图对象层数据：\n", objList);
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
        console.warn("随机道具点位", this.randomPropsPosArr);

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
        console.warn("房间数据", this.roomMap);
        this.createRandomPropsByMapPoint();
        this.createRandomPropsAroundRoomBed();
    }

    /**初始化玩家 */
    initPlayer() {
        playerMgr.player = instantiate(this.rolePre);
        this.roleNode.addChild(playerMgr.player);
        playerMgr.cameraFollow = true;
        this.initRolePos(playerMgr.player);
        playerMgr.playerComp.init(this, 0, pData.skinId);
        this.playerLastRoomIdx = this.getRoomIdxByTilePos(playerMgr.playerComp.currentPos);
    }

    /**初始化机器人 */
    initRobot() {
        for (let i = 0; i < 5; i++) {
            let robot = instantiate(this.rolePre);
            this.roleNode.addChild(robot);
            let robotComp: roleController = robot.getComponent(roleController);
            this.robotArr.push(robotComp);
            this.initRolePos(robot);
            let skinId = ccTools.getRandomNum(0, configData.roleSkinCount);
            robotComp.init(this, i + 1, skinId);
        }
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

        if (playerMgr.playerComp) {
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
            nameLab.active = playerMgr.playerComp?.roleId == roleComp.roleId;
        }

        ccTools.loadImg(avatar, imgPath.roleAvatar + roleComp.skinId);

        let btnComp = roleBtn.getComponent(zoomButton);
        if (!btnComp) {
            btnComp = roleBtn.addComponent(zoomButton);
        }
        btnComp.onClick = this.clickRoleBtn.bind(this, roleComp.roleId);
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

    /**初始化敌人 */
    initEnemy() {
        let enemyNode = instantiate(this.enemyPre);
        this.roleNode.addChild(enemyNode);
        let enemyComp: enemyBaseController = enemyNode.getComponent(enemyBaseController);
        enemyMgr.enemyArr.push(enemyComp);
        let skinId = ccTools.getRandomNum(0, configData.enemySkinCount);
        enemyComp.init(this, enemyMgr.enemyId, skinId);
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
        tileComp.addProps(propsType, level);
        let buildRole = this.getBuildRoleByRoomIdx(tileData.roomIdx);
        buildRole?.addGamePropsBuildCount(propsType);
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

            this.createInitialProps(buildPos, propsData.propsType as tilePropsType, this.getCreateLevelByPropsData(propsData), true, false);
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

            this.createInitialProps(buildPos, propsData.propsType as tilePropsType, this.getCreateLevelByPropsData(propsData), false, true);
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

    /**随机道具表等级从1开始，道具组件等级从0开始 */
    private getCreateLevelByPropsData(propsData: JsonPropsData) {
        return Math.max(0, (Number(propsData?.level) || 1) - 1);
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
            if (!tileItem || tileItem.randomPickPropsRobotId > 0) {
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
    robotPickupRandomProps(tilePos: Vec2, robotId: number) {
        let tileItem = this.getPickableRandomPropsTile(tilePos);
        if (!tileItem || (tileItem.randomPickPropsRobotId > 0 && tileItem.randomPickPropsRobotId != robotId)) {
            return null;
        }

        let propComp = tileItem.propsComp;
        let propsData = {
            propsType: tileItem.tileType,
            level: propComp?.level || 0,
            isSpecialSellProps: propComp?.isSpecialSellProps || false,
            propsNode: tileItem.takePropsItem(),
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
        let propsNode = tileItem.takePropsItem();
        if (!propsNode) {
            return false;
        }

        playerMgr.player.addChild(propsNode);
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
            carriedData.propsComp.destroy();
        }
        carriedData.propsNode.removeFromParent();
        carriedData.propsNode.destroy();
        this.carriedRandomProps = null;
    }

    /**将携带的随机道具放置到房间空位 */
    private placeCarriedRandomPropsInRoom(roomIdx: number) {
        if (!this.carriedRandomProps) {
            return true;
        }

        let roomData: roomData = this.roomMap[roomIdx];
        let buildPos = this.getRandomEmptyPosInRoom(roomData);
        if (!buildPos) {
            uiMgr.showTips("房间没有空位放置道具");
            return false;
        }

        let carriedData = this.carriedRandomProps;
        carriedData.propsComp?.clearData();
        if (carriedData.propsComp) {
            carriedData.propsComp.enabled = false;
            carriedData.propsComp.destroy();
        }
        carriedData.propsNode.removeFromParent();
        carriedData.propsNode.destroy();
        this.carriedRandomProps = null;

        let tileData = this.tileMap[buildPos.x]?.[buildPos.y];
        let tileComp = tileData?.item;
        if (!tileComp) {
            tileComp = this.createTileItem(buildPos, roomIdx);
        }

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
            if (propComp?.propsType == propsType && propComp.isPropsActive) {
                count++;
            }
        }

        return count;
    }

    /**获取房间内指定类型道具最高等级 */
    getRoomPropsMaxLevelByType(roomIdx: number, propsType: string) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !propsType) {
            return -1;
        }

        let maxLevel = -1;
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (propComp?.propsType == propsType) {
                maxLevel = Math.max(maxLevel, propComp.level);
            }
        }

        return maxLevel;
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

    /**房间内不存在指定道具时，在房间空位建造指定类型道具 */
    buildRoomPropsByTypeIfAbsent(roomIdx: number, propsType: tilePropsType, level: number = 0) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !propsType || this.hasRoomPropsByType(roomData, propsType)) {
            return false;
        }

        return this.buildRoomPropsByType(roomIdx, propsType, level);
    }

    /**按房门范围主动建造或升级炮台，返回0无操作、1建造、2升级 */
    buildOrUpgradeCannonByDoor(roomIdx: number, canUpgrade: boolean) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData || !roomData.doorPos) {
            return 0;
        }

        let buildPos = this.getCannonBuildPosByDoorRange(roomData);
        if (buildPos) {
            this.createProps(buildPos, tilePropsType.cannon);
            return 1;
        }

        if (this.hasRoomIdleForCannonBuild(roomData)) {
            return 0;
        }

        if (!canUpgrade) {
            return 0;
        }

        let maxLevel = this.getCannonBuildMaxLevel();
        if (maxLevel < 0) {
            return 0;
        }

        return this.upgradeLowestRoomPropsByTypeRandom(roomData, tilePropsType.cannon, maxLevel) ? 2 : 0;
    }

    /**敌人首次攻击某扇门时，处理周围睡觉人机房间内的炮台 */
    handleTeamCannonByEnemyFirstDoorAttack(doorPos: Vec2, enemyPos: Vec2) {
        if (!doorPos || !this.isGameStartCountDownEnd || robotCommonConfig.checkTeamRange <= 0) {
            return;
        }

        let attackRoomIdx = this.getRoomIdxByTilePos(doorPos);
        let robotArr = this.getSleepingRobotsAroundTile(doorPos, robotCommonConfig.checkTeamRange, attackRoomIdx);
        for (let i = 0; i < robotArr.length; i++) {
            let robotComp = robotArr[i];
            this.buildOrUpgradeTeamCannonByEnemyAttack(robotComp.roomIdx, enemyPos || doorPos);
        }
    }

    /**处理队友房间炮台，返回0无操作、1建造、2升级 */
    private buildOrUpgradeTeamCannonByEnemyAttack(roomIdx: number, enemyPos: Vec2) {
        let roomData: roomData = this.roomMap[roomIdx];
        if (!roomData) {
            return 0;
        }

        if (!this.hasRoomPropsByType(roomData, tilePropsType.cannon)) {
            let buildPos = this.getRoomEmptyPosNearestTo(roomData, enemyPos);
            if (!buildPos) {
                return 0;
            }

            this.createProps(buildPos, tilePropsType.cannon);
            return 1;
        }

        return this.upgradeLowestRoomPropsByTypeRandom(roomData, tilePropsType.cannon, robotCommonConfig.maxUpgradeCannonLevel) ? 2 : 0;
    }

    /**获取指定范围内床上有睡觉人机的角色 */
    private getSleepingRobotsAroundTile(centerPos: Vec2, range: number, excludeRoomIdx: number = 0) {
        let result: roleController[] = [];
        let checkRange = Math.max(0, range || 0);
        for (let i = 0; i < this.robotArr.length; i++) {
            let robotComp = this.robotArr[i];
            if (!robotComp || robotComp.roleId == 0 || robotComp.roomIdx <= 0 || robotComp.state != roleState.bed) {
                continue;
            }

            if (excludeRoomIdx > 0 && robotComp.roomIdx == excludeRoomIdx) {
                continue;
            }

            let bedPos = this.roomMap[robotComp.roomIdx]?.bedPos;
            if (!bedPos) {
                continue;
            }

            if (Math.abs(bedPos.x - centerPos.x) > checkRange || Math.abs(bedPos.y - centerPos.y) > checkRange) {
                continue;
            }

            result.push(robotComp);
        }

        return result;
    }

    /**获取房间中离目标最近的空闲格 */
    private getRoomEmptyPosNearestTo(roomData: roomData, targetPos: Vec2) {
        let result: Vec2 = null;
        let minDistanceSqr = Number.MAX_VALUE;
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos) || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            let offsetX = tilePos.x - targetPos.x;
            let offsetY = tilePos.y - targetPos.y;
            let distanceSqr = offsetX * offsetX + offsetY * offsetY;
            if (distanceSqr < minDistanceSqr) {
                minDistanceSqr = distanceSqr;
                result = tilePos;
            }
        }

        return result;
    }

    /**获取门附近可建造炮台的位置，优先离门近的位置 */
    private getCannonBuildPosByDoorRange(roomData: roomData) {
        let roomEmptyPosArr = this.getCannonBuildRangeEmptyPosArr(roomData);
        if (this.needKeepGeneratorPosInCannonBuildRange(roomData) && roomEmptyPosArr.length <= 1) {
            return null;
        }

        let doorPos = roomData.doorPos;
        let candidates: { pos: Vec2, distance: number }[] = [];
        for (let i = 0; i < roomEmptyPosArr.length; i++) {
            let tilePos = roomEmptyPosArr[i];
            let offsetX = Math.abs(tilePos.x - doorPos.x);
            let offsetY = Math.abs(tilePos.y - doorPos.y);
            candidates.push({
                pos: tilePos,
                distance: offsetX + offsetY,
            });
        }

        if (candidates.length == 0) {
            return null;
        }

        candidates.sort((a, b) => a.distance - b.distance);
        return candidates[0].pos;
    }

    /**房间内是否还有炮台建造可使用的闲置格 */
    private hasRoomIdleForCannonBuild(roomData: roomData) {
        let roomEmptyPosArr = this.getCannonBuildRangeEmptyPosArr(roomData);
        return roomEmptyPosArr.length > (this.needKeepGeneratorPosInCannonBuildRange(roomData) ? 1 : 0);
    }

    /**获取炮台范围内空闲可建造位置 */
    private getCannonBuildRangeEmptyPosArr(roomData: roomData) {
        let result: Vec2[] = [];
        let doorPos = roomData.doorPos;
        let buildDistance = Math.max(0, robotCommonConfig.cannonBuildDistance || 0);
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            if (!this.isInCannonBuildRange(tilePos, doorPos, buildDistance)) {
                continue;
            }

            let tileData = this.tileMap[tilePos.x]?.[tilePos.y];
            let tileComp = tileData?.item;
            if (!tileData || this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos) || (tileComp && tileComp.tileType != tilePropsType.none)) {
                continue;
            }

            result.push(tilePos);
        }

        return result;
    }

    /**是否需要在炮台建造范围内预留发电机位置 */
    private needKeepGeneratorPosInCannonBuildRange(roomData: roomData) {
        return !this.hasRoomPropsByType(roomData, tilePropsType.generator) && this.isCannonBuildRangeCoverRoom(roomData);
    }

    /**炮台建造范围是否覆盖整个房间 */
    private isCannonBuildRangeCoverRoom(roomData: roomData) {
        let doorPos = roomData.doorPos;
        let buildDistance = Math.max(0, robotCommonConfig.cannonBuildDistance || 0);
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            if (this.isSameTilePos(tilePos, roomData.bedPos) || this.isSameTilePos(tilePos, roomData.doorPos)) {
                continue;
            }

            if (!this.isInCannonBuildRange(tilePos, doorPos, buildDistance)) {
                return false;
            }
        }

        return true;
    }

    /**指定格子是否在炮台建造范围内 */
    private isInCannonBuildRange(tilePos: Vec2, doorPos: Vec2, buildDistance: number) {
        return !!tilePos
            && !!doorPos
            && Math.abs(tilePos.x - doorPos.x) <= buildDistance
            && Math.abs(tilePos.y - doorPos.y) <= buildDistance;
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

    /**获取当前时间段炮台主动升级最大等级 */
    private getCannonBuildMaxLevel() {
        let threshold = robotCommonConfig.cannonBuildTimeThreshold || [];
        let timeMin = Number(threshold[0]) || 0;
        let timeMax = Number(threshold[1]) || timeMin;
        if (timeMax < timeMin) {
            let temp = timeMin;
            timeMin = timeMax;
            timeMax = temp;
        }

        if (this.gameStartElapsedTime >= timeMin && this.gameStartElapsedTime <= timeMax) {
            return robotCommonConfig.cannonBuildLevel;
        }

        if (this.gameStartElapsedTime > robotCommonConfig.cannonBuildTimeThresholdLater) {
            return robotCommonConfig.cannonBuildLevelLater;
        }

        return -1;
    }

    /**随机升级房间内最低等级的指定类型道具 */
    private upgradeLowestRoomPropsByTypeRandom(roomData: roomData, propsType: tilePropsType, maxLevel: number) {
        let minLevel = Number.MAX_SAFE_INTEGER;
        let candidates: Vec2[] = [];
        let roomArr = roomData.roomArr || [];
        for (let i = 0; i < roomArr.length; i++) {
            let tilePos = roomArr[i];
            let propComp = this.tileMap[tilePos.x]?.[tilePos.y]?.item?.propsComp;
            if (!propComp || propComp.propsType != propsType || propComp.isMaxLevel || propComp.level >= maxLevel) {
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

    /**倒计时结束 */
    countDownEnd() {
        if (this.isGameStartCountDownEnd) {
            return;
        }

        this.timeNode.active = false;
        this.isGameStartCountDownEnd = true;
        this.stopGameCountDown();
        this.refreshRepairBtnVisible();

        uiMgr.showTips("猎梦者开始行动");
        enemyMgr.enemyArr[0]?.chooseTargetAndFindPath();
    }

    /**刷新倒计时 */
    refreshCountDown() {
        if (this.isGamePause) {
            return;
        }

        this.gameStartCountDownTime--;
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
        this.refreshRepairBtnVisible();
        this.gameStartCountDownTime = enemyCommonConfig.enemyStartTime;
        let timeLabel = this.timeNode.getChildByName("timeLab").getComponent(Label);
        timeLabel.string = this.gameStartCountDownTime.toString();
        this.timeNode.active = true;

        this.schedule(this.refreshCountDown, 1);
    }

    /**刷新修复按钮显隐 */
    private refreshRepairBtnVisible() {
        this.repairBtn.active = this.isGameStartCountDownEnd && playerMgr.playerComp?.roomIdx > 0;
    }

    /**游戏开始倒计时是否已结束 */
    get isEnemyCanMove() {
        return this.isGameStartCountDownEnd && !this.isGamePause;
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
        this.repairMask.fillRange = -this.repairCoolDownTime / configData.repairCoolDown;
    }

    /**摇杆归位 */
    rockerReset() {
        let rockerNode = this.rockerTouchNode.getChildByName("rockerNode");
        let rockerPoint = rockerNode.getChildByName("rockerPoint");
        rockerNode.setPosition(this.rockerInitPos);
        rockerPoint.position = Vec3.ZERO;

        this.isMoving = false;
        playerMgr.playerComp?.playRoleAnim(roleAnimName.idle, true);
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
    private isBlockTileForMove(tileX: number, tileY: number, currentTilePos: Vec2) {
        if (tileX == currentTilePos.x && tileY == currentTilePos.y) {
            return false;
        }

        return this.isBlockTile(tileX, tileY);
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

    /**限制矩形区域移动，默认检测宽20高25且比玩家节点y坐标高8的矩形 */
    limitMoveMatrixPos(offsetPos: Vec3, matrixWidth = 20, matrixHeight = 25, matrixOffsetPos: Vec2 = new Vec2(0, 8)) {
        let limitPos = new Vec3(playerMgr.player.position.x, playerMgr.player.position.y, 0);
        let halfWidth = matrixWidth / 2;
        let halfHeight = matrixHeight / 2;
        let edgeOffset = 0.001;
        let currentTilePos = ccTools.getTileIndexByNodePos(playerMgr.player.position);

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
                    if (this.isBlockTileForMove(checkTileX, y, currentTilePos)) {
                        limitPos.x = this.getTileLeftByTileX(checkTileX) - halfWidth - matrixOffsetPos.x;
                        break;
                    }
                }
            } else {
                let checkTileX = this.getTileXByNodeX(left);
                for (let y = startTileY; y <= endTileY; y++) {
                    if (this.isBlockTileForMove(checkTileX, y, currentTilePos)) {
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
                    if (this.isBlockTileForMove(x, checkTileY, currentTilePos)) {
                        limitPos.y = this.getTileBottomByTileY(checkTileY) - halfHeight - matrixOffsetPos.y;
                        break;
                    }
                }
            } else {
                let checkTileY = this.getTileYByNodeY(bottom + edgeOffset);
                for (let x = startTileX; x <= endTileX; x++) {
                    if (this.isBlockTileForMove(x, checkTileY, currentTilePos)) {
                        limitPos.y = this.getTileTopByTileY(checkTileY) + halfHeight - matrixOffsetPos.y;
                        break;
                    }
                }
            }
        }

        playerMgr.playerComp.currentPos = ccTools.getTileIndexByNodePos(limitPos);
        return limitPos;
    }

    /**检测人物坐标事件 */
    checkPlayerPos() {
        if (playerMgr.playerComp?.state == roleState.bed) {
            this.opratePos = null;
            this.oprateBtn.active = false;
            return;
        }

        let roomIdx = this.tileMap[playerMgr.playerComp.currentPos.x][playerMgr.playerComp.currentPos.y].roomIdx;
        let showOprateBtn = false;
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
            } else if (doorPos && !isClose) {
                //检测没关的门
                opetateLab.string = "关门";
                showOprateBtn = true;
                this.opratePos = doorPos;
            } else if (bedPos) {
                //检测床
                opetateLab.string = "上床";
                showOprateBtn = true;
                this.opratePos = bedPos;
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
        this.oprateBtn.active = showOprateBtn;
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
            } else if (propComp.isMaxLevel && (propComp.propsType == tilePropsType.bed || propComp.propsType == tilePropsType.door)) {
                uiMgr.showTips("已达最大等级");
            } else {
                uiMgr.openPage(UIPath.UIProps, { pos: this.tempUILocalPos, tilePos: tilePos, propsComp: propComp });
            }
        } else {
            uiMgr.openPage(UIPath.UIBuild, { pos: this.tempUILocalPos, tilePos: tilePos, roomData: this.getBuildRoomData(tilePos) });
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

        // 移动玩家（不使用vec3计算）
        if (this.isMoving) {
            let speed = this.isEnemyCanMove ? configData.moveSpeedGame : configData.moveSpeed;
            playerMgr.playerComp?.playRoleAnim(roleAnimName.move, true);
            //玩家移动
            let playerPos = this.limitMoveMatrixPos(new Vec3(this.currentMoveDirection.x * speed * dt, this.currentMoveDirection.y * speed * dt, 0));

            let roleAnimNode = playerMgr.player.getChildByName("roleAnim");
            //人物左右反向
            if (this.currentMoveDirection.x < 0) {
                roleAnimNode.setScale(new Vec3(-1, 1, 1));
            } else {
                roleAnimNode.setScale(new Vec3(1, 1, 1));
            }
            playerMgr.player.setPosition(playerPos);

            this.refreshPlayerRoomChange();

            //检测人物坐标事件
            this.checkPlayerPos();
        }
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
        if (this.robotSuchRoomDelayTime <= 0) {
            return;
        }

        this.robotSuchRoomDelayTime = Math.max(0, this.robotSuchRoomDelayTime - dt);
        if (this.robotSuchRoomDelayTime <= 0) {
            this.robotSuchRoom();
        }
    }

    /**房门受到敌人攻击 */
    onDoorAttackedByEnemy(tilePos: Vec2, damagePercent: number = 0) {
        if (!tilePos || !this.isGameStartCountDownEnd) {
            return;
        }

        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        let robotComp = this.getSleepingRobotInRoom(roomIdx);
        if (roomIdx <= 0 || !robotComp) {
            return;
        }

        if (this.gameStartElapsedTime > robotCommonConfig.enemyAttackTimeThreshold) {
            robotComp.tryHandleDoorAttackLater(damagePercent, this.gameStartElapsedTime);
            return;
        }

        robotComp.tryUpgradeDoorByEnemyAttack();
    }

    /**敌人开始攻击房门 */
    onDoorAttackStartedByEnemy(tilePos: Vec2) {
        if (!tilePos || !this.isGameStartCountDownEnd) {
            return;
        }

        let roomIdx = this.getRoomIdxByTilePos(tilePos);
        let robotComp = this.getSleepingRobotInRoom(roomIdx);
        if (roomIdx <= 0 || !robotComp) {
            return;
        }

        robotComp.onDoorAttackStart();
    }

    /**修改地图内的行走区域 */
    fixTileMapBlock(pos, flag) {
        this.tileMap[pos.x][pos.y].block = flag;
    }

    /**关闭指定房间的门 */
    closeDoorByRoom(roomId: number) {
        let doorTile = this.getDoorByRoom(roomId);
        if (doorTile && !doorTile.isClose) {
            doorTile.tileItemComp.operateProps();
        }

        thornProps.refreshRoomDoorEffect(this, roomId);
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
        let tipsNode = poolMgr.produceTipsPool.get();
        if (!tipsNode) {
            tipsNode = instantiate(uiMgr.produceTipsPrefab);
        }
        tipsNode.active = true;
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
    }

    /**摇杆区域点击开始 */
    onTouchRockerStart(event: EventTouch) {
        let rockerNode = this.rockerTouchNode.getChildByName("rockerNode");
        let rockerPoint = rockerNode.getChildByName("rockerPoint");

        this.currentMoveDirection = Vec3.ZERO;
        let worldPos = event.getUILocation();
        let localPos = this.rockerTouchNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
        rockerNode.setPosition(localPos);
        rockerPoint.position = Vec3.ZERO;
    }

    /**摇杆区域移动 */
    onTouchRockerMove(event: EventTouch) {
        const maxDistance = 96;
        const moveMultiplier = 4; // 移动倍数，可以根据需要调整
        let rockerNode = this.rockerTouchNode.getChildByName("rockerNode");
        let rockerPoint = rockerNode.getChildByName("rockerPoint");

        let worldPos = event.getUILocation();
        let localPos = rockerNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));

        // 计算从基础点到触摸点的向量
        let direction: Vec3 = localPos.subtract(Vec3.ZERO);

        // 应用移动倍数
        let extendedDirection = direction.clone().multiplyScalar(moveMultiplier);


        // 限制摇杆点在最大距离内
        let clampedDirection = extendedDirection.clone();
        if (extendedDirection.length() > maxDistance) {
            clampedDirection = extendedDirection.normalize().multiplyScalar(maxDistance);
        }

        // 获取当前比例（0到1之间）
        let currentRatio = Math.min(extendedDirection.length() / maxDistance, 1.0);

        this.isMoving = true;
        this.currentMoveDirection = direction.clone().normalize().multiplyScalar(currentRatio);

        // 设置摇杆点的位置
        rockerPoint.setPosition(clampedDirection);
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
        let scale = this.uiCamera.orthoHeight / this.gameCamera.orthoHeight;
        let uitrans = this.touchSelect.getComponent(UITransform);
        uitrans.setContentSize(configData.tileSize * scale, configData.tileSize * scale);
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

    /**增加游戏内货币 */
    addGameMonetary() {
        pData.fixGameCoin(1000000);
        pData.fixGamePower(1000000);
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
        switch (event.keyCode) {
            case KeyCode.KEY_S:
                //强制开始游戏
                this.forceStartGame();
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
                pData.fixPassCount();
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
        this.repairMask.fillRange = -1;
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
