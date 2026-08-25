import { _decorator, Node, Prefab, Sprite, ScrollView, instantiate, Label, UITransform, sp, Animation } from 'cc';
import { UIBase } from './UIBase';
import { imgPath, spinePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { roleSkinConfig, JsonRoleSkinData } from '../json/jsonRoleSkin';
import { roleSkinItemController } from '../controller/item/roleSkinItemController';
import { ccTools } from '../extention/generalTools';
import { pData } from '../manager/playerData';
import { videoMgr } from '../manager/videoManager';
import { roleAnimName } from '../controller/roleController';

const { ccclass, property } = _decorator;

@ccclass('UISkinStore')
export class UISkinStore extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Prefab)
    itemPre: Prefab;

    @property(sp.Skeleton)
    showRoleSkin: sp.Skeleton;

    @property(Label)
    nameLab: Label;

    @property(Node)
    getNode: Node;

    @property(Node)
    titleNode: Node;

    @property(ScrollView)
    scrol: ScrollView;

    /** 当前正在穿戴的皮肤 */
    /** 当前选中的皮肤 */
    selectId: number = 0;
    /** 是否完成过初始化 */
    isInit = false;
    /** 当前界面模式：0=角色皮肤，1=敌人皮肤 */
    private mode: number = 0;
    /** 上次初始化时的模式，用于模式切换时重建列表 */
    private lastMode: number = -1;
    /** 已解锁皮肤缓存（根据模式读取角色或敌人） */
    private unlockedSkinMap: { [key: string]: boolean } = {};

    /** 公共操作区按钮 */
    buyBtn: Node;
    videoBtn: Node;
    useBtn: Node;
    tipsNode: Node;

    protected onLoad(): void {
        this.bindBtn();
        this.buyBtn = this.getNode?.getChildByName("buyBtn");
        this.videoBtn = this.getNode?.getChildByName("videoBtn");
        this.useBtn = this.getNode?.getChildByName("useBtn");
        this.tipsNode = this.getNode?.getChildByName("tipsNode");
        this.bindActionBtn();
    }

    onUI_Open($data) {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData($data);
    }

    /** 初始化数据 */
    initData(data) {
        if (data && data.type == 1) {
            this.mode = 1;
        } else {
            this.mode = 0;
        }
        // 更新标题
        ccTools.showChildByIdx(this.titleNode, this.mode);
        // 模式切换时需要重建列表与状态
        if (this.lastMode != this.mode) {
            this.lastMode = this.mode;
            this.isInit = false;
            this.scrol.content && ccTools.destroyAllChild(this.scrol.content);
        }
        if (!this.isInit) {
            this.isInit = true;
            this.loadSkinData();
        }
        this.initList();
        this.refreshShowRoleSkin();
        this.SDKAdReport();
        this.refreshActionNodes();
    }

    /** 关闭按钮绑定 */
    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
    }

    /** 公共操作区按钮绑定 */
    bindActionBtn() {
        this.buyBtn.addComponent(zoomButton).onClick = this.clickBuyBtn.bind(this);
        this.videoBtn.addComponent(zoomButton).onClick = this.clickVideoBtn.bind(this);
        this.useBtn.addComponent(zoomButton).onClick = this.clickUseSelectedBtn.bind(this);
    }

    /** 刷新皮肤列表的选中和穿戴状态 */
    refreshList() {
        for (let i = 0; i < this.scrol.content.children.length; i++) {
            let item = this.scrol.content.children[i];
            let comp = item.getComponent(roleSkinItemController);
            this.refreshItemState(item, comp.skinId);
        }
        this.refreshActionNodes();
    }

    /** 初始化皮肤列表 */
    initList() {
        if (this.scrol.content.children.length <= 0) {
            let skinList = this.getSortedSkinList();
            let imgPre = this.mode == 1 ? imgPath.enemyBodyFull : imgPath.roleBodyFull;
            for (let i = 0; i < skinList.length; i++) {
                let item = instantiate(this.itemPre);
                this.scrol.content.addChild(item);
                let comp = item.getComponent(roleSkinItemController);
                comp.skinId = skinList[i].skinId;
                let roleImg = item.getChildByName("roleImg")?.getComponent(Sprite);
                if (roleImg) {
                    ccTools.loadImg(roleImg, imgPre + comp.skinId);
                }
                this.bindItemSelect(item, comp.skinId);
            }
        }
        this.refreshList();
    }

    /** 获取当前模式下的皮肤数据列表 */
    private getCurrentSkinList(): JsonRoleSkinData[] {
        return this.mode == 1
            ? roleSkinConfig.enemySkinAllData.concat()
            : roleSkinConfig.roleSkinAllData.concat();
    }

    /** 获取排序后的皮肤列表：已拥有在前，组内保持表格顺序 */
    private getSortedSkinList() {
        let skinList = this.getCurrentSkinList();
        skinList.sort((a, b) => {
            let aUnlock = this.isSkinUnlocked(a.skinId) ? 1 : 0;
            let bUnlock = this.isSkinUnlocked(b.skinId) ? 1 : 0;
            return bUnlock - aUnlock;
        });
        return skinList;
    }

    /** 重建皮肤列表 */
    private rebuildList() {
        ccTools.destroyAllChild(this.scrol.content);
        this.initList();
    }

    /** 读取登录接口下发的皮肤数据 */
    private loadSkinData() {
        if (this.mode == 1) {
            this.unlockedSkinMap = pData.unlockedEnemySkin;
            this.selectId = pData.enemySkinId;

            this.unlockSkin(roleSkinConfig.defaultEnemySkinId, false);
            if (!this.isSkinUnlocked(pData.enemySkinId)) {
                pData.setEnemySkinId(roleSkinConfig.defaultEnemySkinId);
                this.selectId = pData.enemySkinId;
            }
        } else {
            this.unlockedSkinMap = pData.unlockedRoleSkin;
            this.selectId = pData.skinId;

            this.unlockSkin(roleSkinConfig.defaultSkinId, false);
            if (!this.isSkinUnlocked(pData.skinId)) {
                pData.setSkinId(roleSkinConfig.defaultSkinId);
                this.selectId = pData.skinId;
            }
        }
    }

    /** 给皮肤条目绑定点击选中事件 */
    private bindItemSelect(item: Node, skinId: number) {
        let btn = item.getComponent(zoomButton) || item.addComponent(zoomButton);
        btn.onClick = this.clickSelectItem.bind(this, skinId);
    }

    /** 刷新单个皮肤条目的状态 */
    private refreshItemState(item: Node, skinId: number) {
        let isUnlocked = this.isSkinUnlocked(skinId);
        let gou = item.getChildByName("gou");
        let select = item.getChildByName("select");
        let lockNode = item.getChildByName("lockNode");

        let currentSkinId = this.mode == 1 ? pData.enemySkinId : pData.skinId;
        if (gou) gou.active = skinId == currentSkinId;
        if (select) select.active = skinId == this.selectId;
        if (lockNode) lockNode.active = !isUnlocked;
    }

    /** 刷新右侧预览皮肤 */
    private async refreshShowRoleSkin() {
        if (!this.showRoleSkin) {
            return;
        }

        this.showRoleSkin.skeletonData = null;
        let spinePre = this.mode == 1 ? spinePath.boss : spinePath.role;
        let isLoaded = await ccTools.loadSpine(this.showRoleSkin, spinePre + this.selectId);
        if (!isLoaded) {
            return;
        }

        this.showRoleSkin.setAnimation(0, roleAnimName.idle, true);

        let scale = 4.5;
        if(this.mode == 1 && this.selectId == 2){
            scale = 3.5;
        }

        this.showRoleSkin.node.setScale(scale, scale, 1);

        this.nameLab.string = roleSkinConfig.getSkinDataById(this.selectId, this.mode)?.name || "";
    }

    /** 更新提示节点宽度 */
    private refreshTipsNodeSize(text: string) {
        if (!this.tipsNode) {
            return;
        }

        let textWidth = text.length;
        let tipsLab = this.tipsNode.getComponentInChildren(Label);
        if (tipsLab) {
            tipsLab.string = text;
            tipsLab.updateRenderData();
            textWidth = tipsLab.node.getComponent(UITransform)?.width || textWidth;
        }

        let tipsTrans = this.tipsNode.getComponent(UITransform);
        if (tipsTrans) {
            tipsTrans.width = textWidth + 40;
        }
    }

    /** 刷新公共操作区按钮 */
    private refreshActionNodes() {
        let skinData = roleSkinConfig.getSkinDataById(this.selectId, this.mode);
        let isUnlocked = this.isSkinUnlocked(this.selectId);
        let buyLab = this.buyBtn?.getComponentInChildren(Label);

        if (this.buyBtn) this.buyBtn.active = false;
        if (this.videoBtn) this.videoBtn.active = false;
        if (this.useBtn) this.useBtn.active = false;
        if (this.tipsNode) this.tipsNode.active = false;

        if (!skinData) {
            return;
        }

        let currentSkinId = this.mode == 1 ? pData.enemySkinId : pData.skinId;

        if (isUnlocked) {
            if (this.selectId == currentSkinId) {
                if (this.tipsNode) this.tipsNode.active = true;
                this.refreshTipsNodeSize("已穿戴");
                return;
            }
            if (this.useBtn) this.useBtn.active = true;
            return;
        }

        if (skinData.limitType == 1) {
            if (this.buyBtn) this.buyBtn.active = true;
            if (buyLab) buyLab.string = `${skinData.money}`;
            return;
        }

        if (skinData.limitType == 2) {
            if (this.videoBtn) this.videoBtn.active = true;
            return;
        }

        if (skinData.limitType == 3) {
            if (!isUnlocked && pData.level >= skinData.levelNum) {
                this.unlockSkin(this.selectId);
                return;
            }
            if (isUnlocked) {
                if (this.useBtn) this.useBtn.active = true;
                return;
            }
            if (this.tipsNode) this.tipsNode.active = true;
            this.refreshTipsNodeSize(`游戏${pData.level}/${skinData.levelNum}局获得`);
        }
    }

    /** 判断皮肤是否已解锁（根据模式读取角色或敌人） */
    private isSkinUnlocked(skinId: number) {
        return this.mode == 1
            ? pData.isEnemySkinUnlocked(skinId)
            : pData.isSkinUnlocked(skinId);
    }

    /** 解锁皮肤并上报云端 */
    private unlockSkin(skinId: number, refresh = true) {
        if (this.mode == 1) {
            pData.setEnemySkinUnlocked(skinId);
        } else {
            pData.setSkinUnlocked(skinId);
        }
        if (refresh) {
            this.rebuildList();
        }
    }

    /**广告点上报 */
    SDKAdReport() {
        videoMgr.SDKAdShow(62);
    }

    ///
    ///点击事件
    ///

    /** 按条件解锁皮肤 */
    private clickUnlockBtn(skinId: number, limitType: number) {
        let skinData = roleSkinConfig.getSkinDataById(skinId, this.mode);
        if (!skinData || this.isSkinUnlocked(skinId)) {
            return;
        }

        if (limitType == 1) {
            if (pData.money < skinData.money) {
                uiMgr.showTips("货币不够");
                return;
            }
            pData.fixMoney(-skinData.money);
            this.unlockSkin(skinId);
            this.clickUseBtn(skinId);
            return;
        }

        if (limitType == 2) {
            videoMgr.watchVideo(62, () => {
                this.unlockSkin(skinId);
                this.clickUseBtn(skinId);
            });
        }
    }

    /** 点击购买按钮 */
    private clickBuyBtn() {
        this.clickUnlockBtn(this.selectId, 1);
    }

    /** 点击广告按钮 */
    private clickVideoBtn() {
        this.clickUnlockBtn(this.selectId, 2);
    }

    /** 使用当前选中的皮肤 */
    private clickUseBtn(skinId: number) {
        if (!this.isSkinUnlocked(skinId)) {
            return;
        }

        this.selectId = skinId;
        if (this.mode == 1) {
            pData.setEnemySkinId(skinId);
        } else {
            pData.setSkinId(skinId);
        }
        this.refreshList();
    }

    /** 使用当前选中皮肤 */
    private clickUseSelectedBtn() {
        this.clickUseBtn(this.selectId);
    }

    /** 选中皮肤，只更新选中态和预览图 */
    private clickSelectItem(skinId: number) {
        this.selectId = skinId;
        this.refreshList();
        this.refreshShowRoleSkin();
        this.refreshActionNodes();
    }

    /** 关闭商店 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UISkinStore);
    }
}
