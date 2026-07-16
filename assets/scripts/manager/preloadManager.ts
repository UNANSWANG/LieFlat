import { _decorator, Component, getSymbolLength, Node } from 'cc';
import { UIManager, uiMgr } from './UIManager';
import { UIPath } from './pathConfig';
import { ccResTools } from '../extention/resTools';
import { gm, PlatType } from './gm';
import { userMgr } from './userManager';
import { pData } from './playerData';
import { ccStorageTools } from '../extention/storageTools';
import { SaveKey } from './configData';
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

        let isShowWarm = Number(ccStorageTools.getLimitTimeData(SaveKey.isShowWarm)) == 0;
        if (isShowWarm) {
            uiMgr.openPage(UIPath.UIWarm);
            ccStorageTools.setLimitTimeData(SaveKey.isShowWarm, 1);
        }
    }
}


