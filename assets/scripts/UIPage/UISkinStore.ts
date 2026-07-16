import { _decorator, Node, Prefab, Sprite, ScrollView, instantiate, Label } from 'cc';
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

    wearId: number = 0;
    selectId: number = 0;
    isInit = false;
    private unlockedSkinMap: { [key: string]: boolean } = {};

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        this.initData();
    }

    initData() {
        if (!this.isInit) {
            this.isInit = true;
            this.loadSkinData();
        }
        this.initList();
        this.refreshShowRoleSkin();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
    }

    refreshList() {
        for (let i = 0; i < this.scrol.content.children.length; i++) {
            let item = this.scrol.content.children[i];
            let comp = item.getComponent(roleSkinItemController);
            this.refreshItemState(item, comp.skinId);
        }
    }

    initList() {
        if (this.scrol.content.children.length <= 0) {
            let skinLength = roleSkinConfig.roleSkinAllData.length;
            for (let i = 0; i < skinLength; i++) {
                let item = instantiate(this.itemPre);
                this.scrol.content.addChild(item);
                let comp = item.getComponent(roleSkinItemController);
                comp.skinId = roleSkinConfig.roleSkinAllData[i].skinId;
                let roleImg = item.getChildByName("roleImg")?.getComponent(Sprite);
                if (roleImg) {
                    ccTools.loadImg(roleImg, imgPath.roleBodyFull + comp.skinId);
                }
                this.bindItemBtn(item, comp.skinId);
                this.bindItemSelect(item, comp.skinId);
            }
        }
        this.refreshList();
    }

    private loadSkinData() {
        this.unlockedSkinMap = ccStorageTools.getData(SaveKey.unlockedRoleSkin) || {};
        this.wearId = ccStorageTools.getNumberData(SaveKey.useRoleSkinId) || roleSkinConfig.defaultSkinId;
        this.selectId = this.wearId || roleSkinConfig.defaultSkinId;

        this.unlockSkin(roleSkinConfig.defaultSkinId, false);
        if (!this.isSkinUnlocked(this.wearId)) {
            this.wearId = roleSkinConfig.defaultSkinId;
            this.selectId = this.wearId;
        }
        ccStorageTools.setData(SaveKey.useRoleSkinId, this.wearId);
    }

    private bindItemBtn(item: Node, skinId: number) {
        let buyBtn = item.getChildByName("buyBtn");
        let videoBtn = item.getChildByName("videoBtn");
        let useBtn = item.getChildByName("useBtn");

        if (buyBtn) {
            buyBtn.addComponent(zoomButton).onClick = this.clickUnlockBtn.bind(this, skinId, 1);
        }
        if (videoBtn) {
            videoBtn.addComponent(zoomButton).onClick = this.clickUnlockBtn.bind(this, skinId, 2);
        }
        if (useBtn) {
            useBtn.addComponent(zoomButton).onClick = this.clickUseBtn.bind(this, skinId);
        }
    }

    private bindItemSelect(item: Node, skinId: number) {
        let btn = item.getComponent(zoomButton) || item.addComponent(zoomButton);
        btn.onClick = this.clickSelectItem.bind(this, skinId);
    }

    private refreshItemState(item: Node, skinId: number) {
        let skinData = roleSkinConfig.getSkinDataById(skinId);
        let isUnlocked = this.isSkinUnlocked(skinId);
        let gou = item.getChildByName("gou");
        let select = item.getChildByName("select");
        let lockNode = item.getChildByName("lockNode");
        let buyBtn = item.getChildByName("buyBtn");
        let videoBtn = item.getChildByName("videoBtn");
        let useBtn = item.getChildByName("useBtn");
        let limitNode = item.getChildByName("limitNode");
        let limitLab = limitNode?.getComponentInChildren(Label);

        if (gou) gou.active = skinId == this.wearId;
        if (select) select.active = skinId == this.selectId;
        if (lockNode) lockNode.active = !isUnlocked;
        if (buyBtn) buyBtn.active = !isUnlocked && skinData?.limitType == 1;
        if (videoBtn) videoBtn.active = !isUnlocked && skinData?.limitType == 2;
        if (useBtn) useBtn.active = isUnlocked && skinId != this.wearId;
        if (limitNode) limitNode.active = !isUnlocked;
        if (limitLab && skinData) {
            limitLab.string = this.getLimitText(skinData);
        }
    }

    private refreshShowRoleSkin() {
        if (!this.showRoleSkin) {
            return;
        }
        ccTools.loadImg(this.showRoleSkin, imgPath.roleBodyFull + this.selectId);
    }

    private isSkinUnlocked(skinId: number) {
        return !!this.unlockedSkinMap[skinId + ""];
    }

    private getLimitText(skinData: any) {
        if (!skinData) {
            return "";
        }
        switch (skinData.limitType) {
            case 1:
                return `${skinData.money}`;
            case 2:
                return "AD";
            case 3:
                return `${pData.passCount}/${skinData.levelNum}`;
            default:
                return "";
        }
    }

    private unlockSkin(skinId: number, refresh = true) {
        this.unlockedSkinMap[skinId + ""] = true;
        ccStorageTools.setData(SaveKey.unlockedRoleSkin, this.unlockedSkinMap);
        if (refresh) {
            this.refreshList();
        }
    }

    private clickUnlockBtn(skinId: number, limitType: number) {
        let skinData = roleSkinConfig.getSkinDataById(skinId);
        if (!skinData || this.isSkinUnlocked(skinId)) {
            return;
        }

        if (limitType == 1) {
            if (pData.money < skinData.money) {
                uiMgr.showTips("Not enough money");
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
            return;
        }

        if (limitType == 3) {
            if (pData.passCount < skinData.levelNum) {
                uiMgr.showTips(`Need ${skinData.levelNum - pData.passCount} more clears`);
                return;
            }
            this.unlockSkin(skinId);
            this.clickUseBtn(skinId);
        }
    }

    private clickUseBtn(skinId: number) {
        if (!this.isSkinUnlocked(skinId)) {
            return;
        }

        this.wearId = skinId;
        this.selectId = skinId;
        ccStorageTools.setData(SaveKey.useRoleSkinId, skinId);
        this.refreshList();
    }

    private clickSelectItem(skinId: number) {
        this.selectId = skinId;
        this.refreshList();
        this.refreshShowRoleSkin();
    }

    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UISkinStore);
    }
}
