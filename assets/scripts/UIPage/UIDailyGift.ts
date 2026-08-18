import { _decorator, Label, Node, Animation, Widget } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { gm } from '../manager/gm';
import { zoomButton } from '../extention/zoomButton';
import { tilePropsType } from '../controller/tileItemController';
import { commonConfig } from '../json/jsonCommon';
const { ccclass, property } = _decorator;

@ccclass('UIDailyGift')
export class UIDailyGift extends UIBase {
    @property(Node)
    shareBtn: Node;

    @property(Node)
    closeBtn: Node;

    @property(Node)
    storePosNode: Node;

    /**奖励魔盒数量 */
    boxNum = 2;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {

    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.onClose.bind(this);
        this.shareBtn.addComponent(zoomButton).onClick = this.clickShareBtn.bind(this);
    }

    ///
    ///点击事件
    ///
    clickShareBtn() {
        gm.API.shareAppMessage(() => {
            uiMgr.showTips("分享成功");
            this.getReward();
        });
    }

    /**领取胜利奖励 */
    private getReward() {
        let boxNode = this.storePosNode.getChildByName("box");
        uiMgr.playRewardAnim(boxNode, this.storePosNode, this.boxNum * 20, () => {
            pData.fixLevelPropsNum(tilePropsType.box, 0, this.boxNum);
            // this.onClose();
        });
    }

    onClose() {
        uiMgr.closePage(UIPath.UIDailyGift);
    }
}



