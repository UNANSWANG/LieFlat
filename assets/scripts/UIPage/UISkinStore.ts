import { _decorator, Node, Prefab, Sprite, ScrollView, instantiate, Label, UITransform } from 'cc';
import { UIBase } from './UIBase';
import { imgPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { roleSkinConfig } from '../json/jsonRoleSkin';
import { roleSkinItemController } from '../controller/item/roleSkinItemController';
import { ccTools } from '../extention/generalTools';
import { pData } from '../manager/playerData';
import { ccStorageTools } from '../extention/storageTools';
import { SaveKey } from '../manager/configData';
import { videoMgr } from '../manager/videoManager';

const { ccclass, property } = _decorator;

@ccclass('UISkinStore')
export class UISkinStore extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Prefab)
    itemPre: Prefab;

    @property(Sprite)
    showRoleSkin: Sprite;

    @property(Node)
    getNode: Node;

    @property(ScrollView)
    scrol: ScrollView;

    /** 当前正在穿戴的皮肤 */
    /** 当前选中的皮肤 */
    selectId: number = 0;
    /** 是否完成过初始化 */
    isInit = false;
    /** 已解锁皮肤缓存 */
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

    onUI_Open() {
        this.initData();
    }

    /** 初始化数据 */
    initData() {
        if (!this.isInit) {
            this.isInit = true;
            this.loadSkinData();
        }
        this.initList();
        this.refreshShowRoleSkin();
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
            for (let i = 0; i < skinList.length; i++) {
                let item = instantiate(this.itemPre);
                this.scrol.content.addChild(item);
                let comp = item.getComponent(roleSkinItemController);
                comp.skinId = skinList[i].skinId;
                let roleImg = item.getChildByName("roleImg")?.getComponent(Sprite);
                if (roleImg) {
                    ccTools.loadImg(roleImg, imgPath.roleBodyFull + comp.skinId);
                }
                this.bindItemSelect(item, comp.skinId);
            }
        }
        this.refreshList();
    }

    /** 获取排序后的皮肤列表：已拥有在前，组内保持表格顺序 */
    private getSortedSkinList() {
        let skinList = roleSkinConfig.roleSkinAllData.concat();
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

    /** 读取皮肤存档 */
    private loadSkinData() {
        this.unlockedSkinMap = ccStorageTools.getData(SaveKey.unlockedRoleSkin) || {};
        this.selectId = pData.skinId;

        this.unlockSkin(roleSkinConfig.defaultSkinId, false);
        if (!this.isSkinUnlocked(pData.skinId)) {
            pData.setSkinId(roleSkinConfig.defaultSkinId);
            this.selectId = pData.skinId;
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

        if (gou) gou.active = skinId == pData.skinId;
        if (select) select.active = skinId == this.selectId;
        if (lockNode) lockNode.active = !isUnlocked;
    }

    /** 刷新右侧预览皮肤 */
    private refreshShowRoleSkin() {
        if (!this.showRoleSkin) {
            return;
        }
        ccTools.loadImg(this.showRoleSkin, imgPath.roleBodyFull + this.selectId);
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
        let skinData = roleSkinConfig.getSkinDataById(this.selectId);
        let isUnlocked = this.isSkinUnlocked(this.selectId);
        let buyLab = this.buyBtn?.getComponentInChildren(Label);

        if (this.buyBtn) this.buyBtn.active = false;
        if (this.videoBtn) this.videoBtn.active = false;
        if (this.useBtn) this.useBtn.active = false;
        if (this.tipsNode) this.tipsNode.active = false;

        if (!skinData) {
            return;
        }

        if (isUnlocked) {
            if (this.selectId == pData.skinId) {
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
            if (!isUnlocked && pData.passCount >= skinData.levelNum) {
                this.unlockSkin(this.selectId);
                return;
            }
            if (isUnlocked) {
                if (this.useBtn) this.useBtn.active = true;
                return;
            }
            if (this.tipsNode) this.tipsNode.active = true;
            this.refreshTipsNodeSize(`游戏${pData.passCount}/${skinData.levelNum}局获得`);
        }
    }

    /** 判断皮肤是否已解锁 */
    private isSkinUnlocked(skinId: number) {
        return !!this.unlockedSkinMap[skinId + ""];
    }

    /** 解锁皮肤并写入本地存储 */
    private unlockSkin(skinId: number, refresh = true) {
        this.unlockedSkinMap[skinId + ""] = true;
        ccStorageTools.setData(SaveKey.unlockedRoleSkin, this.unlockedSkinMap);
        if (refresh) {
            this.rebuildList();
        }
    }

    /** 按条件解锁皮肤 */
    private clickUnlockBtn(skinId: number, limitType: number) {
        let skinData = roleSkinConfig.getSkinDataById(skinId);
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
            videoMgr.watchVideo(68, () => {
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
        pData.setSkinId(skinId);
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
