import { _decorator, Component, Node, Animation, Prefab, Sprite, ScrollView, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { imgPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { roleSkinConfig } from '../json/jsonRoleSkin';
import { roleSkinItemController } from '../controller/item/roleSkinItemController';
import { ccTimeTools } from '../extention/timeTools';
import { ccTools } from '../extention/generalTools';
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

    ///
    ///赋值节点
    ///
    /**购买按钮 */
    buyBtn: Node;
    /**视频按钮 */
    videoBtn: Node;
    /**使用按钮 */
    useBtn: Node;
    /**限制节点 */
    limitNode: Node;

    /**穿戴id */
    wearId: number = 0;
    /**选择id */
    selectId: number = 0;
    /**是否初始化过 */
    isInit = false;

    protected onLoad(): void {
        this.bindBtn();

    }

    onUI_Open() {
        this.initData();
    }

    initData() {
        if (!this.isInit) {
            this.isInit = true;
            this.wearId = roleSkinConfig.defaultSkinId;
            this.selectId = roleSkinConfig.defaultSkinId;
        }
        this.initList();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
    }

    /**刷新列表 */
    refreshList() {
        for (let i = 0; i < this.scrol.content.children.length; i++) {
            let item = this.scrol.content.children[i];
            let comp = item.getComponent(roleSkinItemController);
            let gou = item.getChildByName("gou");
            let select = item.getChildByName("select");
            let lockNode = item.getChildByName("lockNode");

            gou.active = comp.skinId == this.wearId;
            select.active = comp.skinId == this.selectId;
        }
    }

    /**初始化列表 */
    initList() {
        if (this.scrol.content.children.length <= 0) {
            let skinLenth = roleSkinConfig.roleSkinAllData.length;
            for (let i = 0; i < skinLenth; i++) {
                let item = instantiate(this.itemPre);
                this.scrol.content.addChild(item);
                let comp = item.getComponent(roleSkinItemController);
                comp.skinId = roleSkinConfig.roleSkinAllData[i].skinId;
                let roleImg = item.getChildByName("roleImg").getComponent(Sprite);
                ccTools.loadImg(roleImg, imgPath.roleBodyFull + comp.skinId);
            }
            this.refreshList();
        } else {
            this.refreshList();
        }
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UISkinStore);
    }
}


