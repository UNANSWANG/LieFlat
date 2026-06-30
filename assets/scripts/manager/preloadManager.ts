import { _decorator, Component, getSymbolLength, Node } from 'cc';
import { UIManager, uiMgr } from './UIManager';
import { UIPath } from './pathConfig';
import { ccResTools } from '../extention/resTools';
import { gm, PlatType } from './gm';
import { userMgr } from './userManager';
import { pData } from './playerData';
const { ccclass, property } = _decorator;

@ccclass('preloadManager')
export class preloadManager extends Component {
    protected onLoad(): void {
        this.initData();
        this.initSDK();
    }

    initData() {
        /**初始化界面管理 */
        uiMgr.initData(this.node);

        uiMgr.openPage(UIPath.UIMain);
    }

    initSDK() {
        if (gm.API.PLAT && gm.API.PLAT.HgSdk) {
            console.warn("初始化HgSdk");
            gm.hgSdk = new gm.API.PLAT.HgSdk();
            gm.hgSdk.init((res) => {
                const gameId = res.game_id
                const status = res.status

                if (status === 0) {
                    // 调用登录
                    gm.hgSdk.login((res) => {
                        // console.warn("登录成功，uid:", res.uid, "token:", res.token);
                    })
                }
            })
        } else {
            console.warn("没有HgSdk对象");
        }
    }
}


