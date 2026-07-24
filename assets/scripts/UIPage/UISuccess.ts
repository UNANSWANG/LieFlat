import { _decorator, Component, Node, Animation, Sprite } from 'cc';
import { UIBase } from './UIBase';
import { audioPath, imgPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { pData } from '../manager/playerData';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
import { audioMgr } from '../manager/audioManager';
import { zoomButton } from '../extention/zoomButton';
import { ccTools } from '../extention/generalTools';
const { ccclass, property } = _decorator;

@ccclass('UISuccess')
export class UISuccess extends UIBase {
    @property(Node)
    adBtn: Node;

    @property(Node)
    commonBtn: Node;

    @property(Node)
    moneyRewardNode: Node;

    @property(Node)
    boxRewardNode: Node;

    @property(Node)
    boxNode: Node;

    @property(Sprite)
    roleImg: Sprite;

    /**奖励污染币数量 */
    moneyNum = 0;
    /**奖励魔盒数量 */
    boxNum = 0;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open(data?) {
        gm.gamePause();
        audioMgr.playEffect(audioPath.success);
        this.initData(data);
    }

    initData(data?) {
        if (data) {
            let skinId = data.skinId;
            ccTools.loadImg(this.roleImg, imgPath.roleBodyFull + skinId);
        }

        //TODO 临时写数量
        this.moneyNum = 30;
        this.boxNum = 3;

        pData.SDKReportLevelComplete();
        pData.addLevel();
    }

    bindBtn() {
        this.adBtn.addComponent(zoomButton).onClick = this.clickAdBtn.bind(this);
        this.commonBtn.addComponent(zoomButton).onClick = this.clickCommonBtn.bind(this);
    }


    ///
    ///点击事件
    ///

    /**点击广告按钮 */
    clickAdBtn() {
        uiMgr.showTips("广告");
    }

    /**点击普通按钮 */
    clickCommonBtn() {
        uiMgr.showTips("普通按钮");
    }

    onClose() {
        gm.gameResume();
        uiMgr.closePage(UIPath.UISuccess);
    }
}


