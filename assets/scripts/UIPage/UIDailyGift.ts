import { _decorator, Label, Node, Animation, Widget } from 'cc';
import { UIBase } from './UIBase';
import { UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { gm } from '../manager/gm';
import { zoomButton } from '../extention/zoomButton';
import { tilePropsType } from '../controller/tileItemController';
import { commonConfig } from '../json/jsonCommon';
import { SaveKey } from '../manager/configData';
const { ccclass, property } = _decorator;

@ccclass('UIDailyGift')
export class UIDailyGift extends UIBase {
    @property(Node)
    shareBtn: Node;

    @property(Node)
    closeBtn: Node;

    @property(Node)
    completeBtn: Node;

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
        this.refreshShareBtn();
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.onClose.bind(this);
        this.shareBtn.addComponent(zoomButton).onClick = this.clickShareBtn.bind(this);
    }

    /**刷新分享按钮和已领取按钮 */
    private refreshShareBtn() {
        let hasGetGift = this.hasGetGiftToday();
        this.shareBtn.active = !hasGetGift;
        if (this.completeBtn) {
            this.completeBtn.active = hasGetGift;
        }
    }

    /**今日是否已经通过分享领取过每日礼包（数据存于后端） */
    private hasGetGiftToday() {
        return pData.getLimitTimeData(SaveKey.isGetDailyGift) == 1;
    }

    ///
    ///点击事件
    ///

    /**点击分享按钮 */
    clickShareBtn() {
        if (this.hasGetGiftToday()) {
            this.refreshShareBtn();
            return;
        }
        if (!gm.API) {
            uiMgr.showTips("当前平台暂不支持分享");
            return;
        }

        gm.API.shareAppMessage(() => {
            if (this.hasGetGiftToday()) {
                this.refreshShareBtn();
                return;
            }

            uiMgr.showTips("分享成功");
            //记录今日已领取（上报到后端）
            pData.setLimitTimeData(SaveKey.isGetDailyGift, 1);
            this.getReward();
        });
    }

    /**领取胜利奖励 */
    private getReward() {
        let boxNode = this.shareBtn.getChildByName("box");
        uiMgr.playRewardAnim(boxNode, uiMgr.storeNode, this.boxNum, () => {
            pData.fixLevelPropsNum(tilePropsType.box, 0, this.boxNum);
        });
        this.refreshShareBtn();
        this.onClose();
    }

    onClose() {
        uiMgr.closePage(UIPath.UIDailyGift);
    }
}



