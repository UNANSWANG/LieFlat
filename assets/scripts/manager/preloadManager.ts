import { _decorator, Component, getSymbolLength, Node } from 'cc';
import { uiMgr } from './UIManager';
import { UIPath } from './pathConfig';
import { ccStorageTools } from '../extention/storageTools';
import { GameEvent, SaveKey } from './configData';
import { gm } from './gm';
import { pData } from './playerData';
const { ccclass, property } = _decorator;

@ccclass('preloadManager')
export class preloadManager extends Component {
    protected onLoad(): void {
        this.initData();
    }

    initData() {
        /**初始化界面管理 */
        uiMgr.initData(this.node);

        uiMgr.openPage(UIPath.UIMain);

        //TODO 测试
        uiMgr.openQueuePage(UIPath.UIWarm);
        uiMgr.openQueuePage(UIPath.UIAnnouncement);

        let isShowWarm = Number(ccStorageTools.getLimitTimeData(SaveKey.isShowWarm)) == 0;
        if (isShowWarm) {
            uiMgr.openQueuePage(UIPath.UIWarm);
            uiMgr.openQueuePage(UIPath.UIAnnouncement);

            ccStorageTools.setLimitTimeData(SaveKey.isShowWarm, 1);
        }

        gm.Event.on(GameEvent.fullSkin, pData.getAllSkin, this);
    }
}


