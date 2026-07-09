import { tilePropsType } from "../controller/tileItemController";
import { ccTools } from "../extention/generalTools";
import { zoomButton } from "../extention/zoomButton";
import { propsConfig } from "../json/jsonProps";
import { configData, GameEvent } from "../manager/configData";
import { gm } from "../manager/gm";
import { imgPath, UIPath } from "../manager/pathConfig";
import { pData } from "../manager/playerData";
import { playerMgr } from "../manager/playerManager";
import { uiMgr } from "../manager/UIManager";
import { UIBase } from "./UIBase";
const { ccclass, property } = _decorator;
import { _decorator, instantiate, Label, Node, Prefab, Sprite, UITransform, Vec2, Vec3 } from 'cc';

@ccclass('UIBuild')
export class UIBuild extends UIBase {
    @property(Node)
    bg: Node = null;

    @property(Node)
    btnLayout: Node = null;

    @property(Node)
    propsLayout: Node = null;

    @property(Prefab)
    propsItemPre: Prefab = null;


    /**当前页签 */
    currentIdx: number = 0;
    /**分类道具数组 基础，赚钱，高科技，黑科技，工坊 */
    propsTypeArr: any[][] = null;
    /**当前瓦片位置 */
    tilePos: Vec2 = new Vec2();
    /**当前目标位置 */
    targetPos: Vec3 = new Vec3();
    /**当前页面道具数据 */
    currentPropsDataArr: any[] = [];
    /**当前房间数据 */
    roomData: any = null;

    protected onLoad(): void {
        this.bindBtn();
    }

    protected onEnable(): void {
        this.addListener();
    }

    protected onDisable(): void {
        this.removeListener();
    }

    addListener() {
        gm.Event.on(GameEvent.refreshGameMonetary, this.refreshPropsBtnState, this);
    }

    removeListener() {
        gm.Event.off(GameEvent.refreshGameMonetary, this.refreshPropsBtnState, this);
    }

    onUI_Open(data) {
        this.initData(data);
    }

    initData(data) {
        if (data) {
            this.targetPos.set(data.pos);
            this.tilePos.set(data.tilePos);
            this.roomData = data.roomData;
        }
        this.initPropsData();
        this.refreshPage();
    }

    bindBtn() {
        this.btnLayout.children.forEach((item, idx) => {
            item.addComponent(zoomButton).onClick = this.clickTabBtn.bind(this, idx);
        });
    }

    /**初始化道具数据 */
    initPropsData() {
        let propsData = propsConfig.getAllTable();
        this.propsTypeArr = [[], [], [], [], []];

        Object.values(propsData).forEach((item) => {
            let propsItem = item[0];
            let type = propsItem.propsType;
            let buildType = propsItem.buildType;

            if (buildType > 0 && buildType <= this.propsTypeArr.length && this.propsTypeArr[buildType - 1].indexOf(type) < 0) {
                if (type == "vein") {
                    let pointerData = propsConfig.getPropsData(type);
                    for (let i = 0; i < pointerData.length; i++) {
                        this.propsTypeArr[buildType - 1].push({type: type, level: i});
                    }
                } else {
                    this.propsTypeArr[buildType - 1].push({type: type, level: 0});
                }
            }
        });
    }

    /**刷新页面 */
    refreshPage() {
        this.currentPropsDataArr = [];
        //刷新按钮
        for (let i = 0; i < this.btnLayout.children.length; i++) {
            this.btnLayout.children[i].getChildByName("select").active = i == this.currentIdx;
        }
        let currentPropsTypeArr = this.propsTypeArr?.[this.currentIdx] || [];
        let propsLength = currentPropsTypeArr.length;
        //将已有道具项隐藏起来
        for (let i = 0; i < this.propsLayout.children.length; i++) {
            this.propsLayout.children[i].active = false;
        }

        for (let i = 0; i < propsLength; i++) {
            let propsItem = this.propsLayout.children[i];
            if (!propsItem) {
                propsItem = instantiate(this.propsItemPre);
                this.propsLayout.addChild(propsItem);
            }

            propsItem.active = true;

            let propsTypeData = propsConfig.getPropsData(currentPropsTypeArr[i].type);
            let propsData = null;
            let level = currentPropsTypeArr[i].level;

            propsData = propsTypeData[level];

            //增加level属性
            propsData.level = level;

            this.currentPropsDataArr.push(propsData);

            let propsImg = propsItem.getChildByName("propsImg").getComponent(Sprite);
            let desLab = propsItem.getChildByName("desLab").getComponent(Label);
            let nameLab = propsItem.getChildByName("nameLab").getComponent(Label);
            let buyBtn = propsItem.getChildByName("buyBtn");
            let buyLayout = buyBtn.getChildByName("layout");
            let coinLayout = buyLayout.getChildByName("coinNumLayout");
            let powerLayout = buyLayout.getChildByName("powerNumLayout");
            let limitLab = buyBtn.getChildByName("limitLab").getComponent(Label);
            let coinNumLab = coinLayout.getChildByName("numLab").getComponent(Label);
            let powerNumLab = powerLayout.getChildByName("numLab").getComponent(Label);

            let powerNum = propsData.power;
            let coinNum = propsData.coin;
            if (propsData.builNumMax && propsData.builNumMax > 0) {
                let buildCount = this.getPropsBuildLimitCount(propsData);
                limitLab.string = `可建造 ${buildCount}/${propsData.builNumMax}`;
            } else {
                limitLab.string = "";
            }

            this.refreshBuyBtnState(buyBtn, propsData);

            if (powerNum > 0 && coinNum > 0) {
                //全部支付
                coinLayout.active = true;
                powerLayout.active = true;
                coinLayout.scale = new Vec3(0.6, 0.6, 1);
                powerLayout.scale = new Vec3(0.6, 0.6, 1);
            } else if (powerNum > 0) {
                //电能支付
                coinLayout.active = false;
                powerLayout.active = true;
                coinLayout.scale = new Vec3(1, 1, 1);
                powerLayout.scale = new Vec3(1, 1, 1);
            } else {
                //金币支付
                coinLayout.active = true;
                powerLayout.active = false;
                coinLayout.scale = new Vec3(1, 1, 1);
                powerLayout.scale = new Vec3(1, 1, 1);
            }

            desLab.string = propsData.desc;
            coinNumLab.string = propsData.coin + "";
            powerNumLab.string = propsData.power + "";
            nameLab.string = propsData.name;
            ccTools.loadImg(propsImg, imgPath.gamePpropsPreview + currentPropsTypeArr[i].type + "_" + propsData.level);

            let btnComp = buyBtn.getComponent(zoomButton);
            if (!btnComp) {
                btnComp = buyBtn.addComponent(zoomButton);
                btnComp.onClick = this.clickBuyBtn.bind(this, i);
            }
        }

        let addOffset = 139;

        let height = 215 + addOffset * propsLength;

        let bgTrans = this.bg.getComponent(UITransform);
        bgTrans.setContentSize(bgTrans.width, height);

        let posY = this.targetPos.y + (height / 2 + configData.tileSize + 15) * (this.targetPos.y < 0 ? 1 : -1);

        this.bg.setPosition(new Vec3(this.bg.position.x, posY, 0));
    }

    /**刷新按钮状态 */
    refreshPropsBtnState() {
        for (let i = 0; i < this.currentPropsDataArr.length; i++) {
            let propsItem = this.propsLayout.children[i];
            if (!propsItem || !propsItem.active) {
                continue;
            }

            this.refreshBuyBtnState(propsItem.getChildByName("buyBtn"), this.currentPropsDataArr[i]);
        }
    }

    /**刷新购买按钮状态 */
    private refreshBuyBtnState(buyBtn: Node, propsData: any) {
        if (!buyBtn || !propsData) {
            return;
        }

        let buyBg = buyBtn.getChildByName("bg");
        let grayBg = buyBg.getChildByName("gray");
        let normalBg = buyBg.getChildByName("normal");
        let canBuy = ccTools.checkCanBuy(propsData) && !this.isBuildNumLimit(propsData);
        grayBg.active = !canBuy;
        normalBg.active = canBuy;
    }

    /**获取当前房间内指定类型道具数量 */
    private getRoomPropsBuildCount(propsData: any) {
        if (!this.roomData || !propsData) {
            return 0;
        }

        return this.roomData.propsCountMap?.[propsData.propsType] || 0;
    }

    /**获取用于建造上限判断的数量 */
    private getPropsBuildLimitCount(propsData: any) {
        if (!propsData) {
            return 0;
        }

        if (propsData.propsType == tilePropsType.box) {
            return playerMgr.playerComp?.getGamePropsBuildCountByType(propsData.propsType) || 0;
        }

        return this.getRoomPropsBuildCount(propsData);
    }

    /**是否达到当前房间建造数量上限 */
    private isBuildNumLimit(propsData: any) {
        if (!propsData?.builNumMax || propsData.builNumMax <= 0) {
            return false;
        }

        return this.getPropsBuildLimitCount(propsData) >= propsData.builNumMax;
    }

    ///
    ///点击事件
    ///

    /**点击页签按钮 */
    clickTabBtn(idx: number) {
        if (idx == this.currentIdx) {
            return;
        }

        if (!this.propsTypeArr?.[idx] || this.propsTypeArr[idx].length == 0) {
            uiMgr.showTips("暂无道具");
            return;;
        }
        this.currentIdx = idx;
        this.refreshPage();
    }

    /**点击购买按钮 */
    clickBuyBtn(idx: number) {
        let curData = this.currentPropsDataArr[idx];
        if (this.isBuildNumLimit(curData)) {
            uiMgr.showTips("建造数量已达上限");
        } else if (curData.coin > 0 && curData.coin > pData.gameCoin) {
            uiMgr.showTips("金币不足");
        } else if (curData.power > 0 && curData.power > pData.gamePower) {
            uiMgr.showTips("电能不足");
        } else {
            this.onClose();
            //扣除金币
            if (curData.coin > 0) {
                pData.fixGameCoin(-curData.coin);
            }
            //扣除电能
            if (curData.power > 0) {
                pData.fixGamePower(-curData.power);
            }
            gm.Event.emit(GameEvent.createProps, this.tilePos, curData.propsType as tilePropsType, curData.level);
        }
    }

    onClose() {
        uiMgr.closePage(UIPath.UIBuild);
    }
}
