import { _decorator, Button, Component, EventKeyboard, input, Input, KeyCode, Label, Node, NodeEventType, sp, tween, Tween, Vec3 } from 'cc';
import { gamePath, spinePath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { UIBase } from './UIBase';
import { zoomButton } from '../extention/zoomButton';
import { pData } from '../manager/playerData';
import { GameEvent, SaveKey } from '../manager/configData';
import { gm, PlatType } from '../manager/gm';
import { ccStorageTools } from '../extention/storageTools';
import { TTManager } from '../sdk/plat/tt/TTManager';
import { loopAnimation } from '../controller/loopAnimation';
import { userMgr } from '../manager/userManager';
import { WXManager } from '../sdk/plat/wx/WXManager';
import { ccTools } from '../extention/generalTools';
import { roleAnimName } from '../controller/roleController';
const { ccclass, property } = _decorator;

@ccclass('UIMain')
export class UIMain extends UIBase {
    @property(Node)
    startBtn: Node = null;

    @property(Node)
    setBtn: Node = null;

    @property(Node)
    rankBtn: Node = null;

    @property(Node)
    storeBtn: Node = null;

    @property(Node)
    skinStoreBtn: Node = null;

    @property(Node)
    revisitBtn: Node = null;

    @property(sp.Skeleton)
    roleAnim: sp.Skeleton = null;

    @property(Node)
    zombieAnim: Node = null;

    /**僵尸1的起始和目标x坐标 */
    zombie1XRange = [-604, 682];
    /**僵尸2的起始和目标x坐标 */
    zombie2XRange = [593, -670];
    /**僵尸3的起始和目标x坐标 */
    zombie3XRange = [-671, 675];

    /**僵尸移动速度，单位为每秒的 x 坐标距离 */
    zombieMoveSpeeds = [70, 90, 55];

    /**是否展示过复访按钮 */
    isShowRevisit = false;

    onLoad() {
        this.bindBtn();
    }

    onUI_Open(data?: any): void {
        this.addListener();
        this.initData();
        this.startZombieAnim();
    }

    onUI_Close(data?: any): void {
        this.stopZombieAnim();
        this.removeListener();
    }

    /**初始化数据 */
    initData() {
        this.refreshRed();
        this.checkRevisitBtn();
        this.refreshRoleAnim();
    }

    bindBtn() {
        this.startBtn.addComponent(zoomButton).onClick = this.cliskStartBtn.bind(this);
        this.setBtn.addComponent(zoomButton).onClick = this.cliskSetBtn.bind(this);
        this.rankBtn.addComponent(zoomButton).onClick = this.clickRankBtn.bind(this);
        this.revisitBtn.addComponent(zoomButton).onClick = this.clickRevisitBtn.bind(this);
        this.storeBtn.addComponent(zoomButton).onClick = this.clickStoreBtn.bind(this);
        this.skinStoreBtn.addComponent(zoomButton).onClick = this.clickSkinStoreBtn.bind(this);
    }

    /**添加监听 */
    addListener() {
        // 监听刷新红点事件
        gm.Event.on(GameEvent.refreshRed, this.refreshRed, this);
        gm.Event.on(GameEvent.refreshRoleSkin, this.refreshRoleAnim, this);
    }

    /**删除监听 */
    removeListener() {
        // 监听刷新红点事件
        gm.Event.off(GameEvent.refreshRed, this.refreshRed, this);
        gm.Event.off(GameEvent.refreshRoleSkin, this.refreshRoleAnim, this);
    }

    /**刷新主页角色皮肤并循环播放待机动画 */
    private async refreshRoleAnim() {
        if (!this.roleAnim) {
            return;
        }

        this.roleAnim.skeletonData = null;
        let isLoaded = await ccTools.loadSpine(this.roleAnim, spinePath.role + pData.skinId);
        if (!isLoaded || !this.roleAnim || !this.roleAnim.isValid) {
            return;
        }

        this.roleAnim.setAnimation(0, roleAnimName.idle, true);
    }

    /**开始播放三只僵尸的独立往返移动动画 */
    private startZombieAnim() {
        if (!this.zombieAnim || !this.zombieAnim.isValid) {
            return;
        }

        const ranges = [this.zombie1XRange, this.zombie2XRange, this.zombie3XRange];
        const zombieNodes = this.zombieAnim.children;
        for (let i = 0; i < 3; i++) {
            const zombieNode = zombieNodes[i];
            const range = ranges[i];
            if (!zombieNode || !range || range.length < 2) {
                continue;
            }

            const startX = Number(range[0]);
            const endX = Number(range[1]);
            const distance = Math.abs(endX - startX);
            const speed = Math.max(1, Number(this.zombieMoveSpeeds[i]) || 1);
            const position = zombieNode.position;
            const startPosition = new Vec3(startX, position.y, position.z);
            const endPosition = new Vec3(endX, position.y, position.z);
            const firstDirection = endX >= startX ? 1 : -1;
            const firstDuration = Math.max(0.01, distance / speed);
            const returnDuration = firstDuration;

            Tween.stopAllByTarget(zombieNode);
            zombieNode.setPosition(startPosition);
            this.setZombieFacing(zombieNode, firstDirection);

            tween(zombieNode)
                .to(firstDuration, { position: endPosition })
                .call(() => this.setZombieFacing(zombieNode, -firstDirection))
                .to(returnDuration, { position: startPosition })
                .call(() => this.setZombieFacing(zombieNode, firstDirection))
                .union()
                .repeatForever()
                .start();
        }
    }

    /**停止僵尸移动动画 */
    private stopZombieAnim() {
        if (!this.zombieAnim || !this.zombieAnim.isValid) {
            return;
        }

        this.zombieAnim.children.forEach((zombieNode) => Tween.stopAllByTarget(zombieNode));
    }

    /**根据移动方向设置僵尸朝向，同时保留原有缩放比例 */
    private setZombieFacing(zombieNode: Node, direction: number) {
        const scale = zombieNode.scale;
        zombieNode.setScale(Math.abs(scale.x) * (direction < 0 ? -1 : 1), scale.y, scale.z);
    }

    /**刷新红点 */
    refreshRed() {

    }

    /**检测复访按钮 */
    checkRevisitBtn() {
        this.revisitBtn.active = gm.platType == PlatType.tt;
        //抖音平台
        if (gm.platType == PlatType.tt && !this.isShowRevisit) {
            let isGetted = ccStorageTools.getLimitTimeData(SaveKey.isGetRevisit) == 1;
            let TTMgr = gm.API as TTManager;
            let canGet = TTMgr.checkCanGetGift();
            if (canGet && !isGetted) {
                this.isShowRevisit = true;
                this.clickRevisitBtn();
            }
        }
    }

    ///
    ///点击事件
    ///

    /**开始游戏 */
    cliskStartBtn() {
        uiMgr.openPage(UIPath.UIMatch);
    }

    /**点击设置 */
    cliskSetBtn() {
        uiMgr.openPage(UIPath.UISetting, { mode: 0 });
    }

    /**点击复访 */
    clickRevisitBtn() {
        uiMgr.openPage(UIPath.UIRevisit);
    }

    /**点击排行榜 */
    clickRankBtn() {
        // uiMgr.openPage(UIPath.UIRank);
        return;
        //有昵称和授权或者h5平台才直接打开排行榜
        if ((gm.API.isAuthorize && userMgr.nickName) || gm.platType == PlatType.h5) {
            uiMgr.openPage(UIPath.UIRank);
        } else {
            let getUserInfo = () => {
                let wxMgr = gm.API as WXManager;
                wxMgr.getUserProfile(() => {
                    uiMgr.openPage(UIPath.UIRank);
                }, () => {
                    uiMgr.openPage(UIPath.UIRank);
                });
            }

            if (!gm.API.isAuthorize) {
                //没有授权
                gm.API.requirePrivacyAuthorize(() => {
                    console.log("授权成功");
                    if (!userMgr.nickName) {
                        getUserInfo();
                    } else {
                        uiMgr.openPage(UIPath.UIRank);
                    }
                }, () => {
                    console.log("授权失败");
                    uiMgr.openPage(UIPath.UIRank);
                });
            } else {
                //有授权但是没有昵称
                getUserInfo();
            }
        }
    }

    /**点击商店 */
    clickStoreBtn() {
        uiMgr.openPage(UIPath.UIStore);
    }

    /**点击皮肤商店 */
    clickSkinStoreBtn() {
        uiMgr.openPage(UIPath.UISkinStore);
    }
}


