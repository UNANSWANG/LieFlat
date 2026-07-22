import { _decorator, Node, Animation, ScrollView, Prefab, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { propsConfig } from '../json/jsonProps';
const { ccclass, property } = _decorator;

@ccclass('UIStore')
export class UIStore extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    selectLayout: Node;

    @property(ScrollView)
    scrol: ScrollView;

    @property(Prefab)
    itemPrefab: Prefab;

    /**当前选中的商城类型 */
    currentTypeIdx: number = 0;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.currentTypeIdx = 0;
        this.refreshPage();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.selectLayout.children.forEach((item, idx) => {
            item.addComponent(zoomButton).onClick = this.clickTypeBtn.bind(this, idx);
        });
    }

    /**刷新商城类型和列表 */
    refreshPage() {
        for (let i = 0; i < this.selectLayout.children.length; i++) {
            let selectNode = this.selectLayout.children[i].getChildByName("selcet")
                || this.selectLayout.children[i].getChildByName("select");
            if (selectNode) {
                selectNode.active = i == this.currentTypeIdx;
            }
        }

        let storePropsData = propsConfig.getStorePropsData();
        let currentPropsData = storePropsData[this.currentTypeIdx] || [];

        for (let i = 0; i < this.scrol.content.children.length; i++) {
            this.scrol.content.children[i].active = false;
        }

        for (let i = 0; i < currentPropsData.length; i++) {
            let item = this.scrol.content.children[i];
            if (!item) {
                item = instantiate(this.itemPrefab);
                this.scrol.content.addChild(item);
            }
            item.active = true;
        }

        this.scrol.scrollToTop();
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    /**点击商城类型 */
    clickTypeBtn(idx: number) {
        if (idx == this.currentTypeIdx) {
            return;
        }
        this.currentTypeIdx = idx;
        this.refreshPage();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIStore);
    }
}


