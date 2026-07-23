import { _decorator, Node, Animation, Label, Sprite, SpriteFrame } from 'cc';
import { UIBase } from './UIBase';
import { imgPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { configData } from '../manager/configData';
import { pData } from '../manager/playerData';
import { ccTools } from '../extention/generalTools';
import { roleSkinConfig } from '../json/jsonRoleSkin';
const { ccclass, property } = _decorator;

type MatchTarget = {
    node: Node;
    type: "role" | "enemy";
    roleIndex?: number;
};

@ccclass('UIMatch')
export class UIMatch extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    readyBtn: Node;

    @property(Node)
    readyedBtn: Node;

    @property(Label)
    timeLab: Label;

    @property(Node)
    enemyItem: Node;

    @property(Node)
    roleLayout: Node;

    /**匹配经过时间 */
    private matchTime = 0;
    /**当前匹配项剩余等待时间 */
    private currentMatchDelay = 0;
    /**当前待匹配项索引 */
    private currentMatchIndex = 0;
    /**是否正在匹配人机 */
    private isMatching = false;
    /**玩家是否已准备 */
    private isReady = false;
    /**是否正在进入游戏 */
    private isOpeningGame = false;
    /**待匹配项，包含一个敌人和五个机器人 */
    private matchTargets: MatchTarget[] = [];
    /**五个机器人的皮肤，索引与游戏内机器人顺序一致 */
    private roleSkinIds: number[] = [];
    /**敌人皮肤 */
    private enemySkinId = 0;
    /**预制体默认的未知角色图片 */
    private unknownRoleSpriteFrame: SpriteFrame = null;

    protected onLoad(): void {
        this.unknownRoleSpriteFrame = this.roleLayout.children[0]?.getChildByName("roleImg")?.getComponent(Sprite)?.spriteFrame || null;
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.matchTime = 0;
        this.currentMatchIndex = 0;
        this.currentMatchDelay = 0;
        this.isMatching = false;
        this.isReady = false;
        this.isOpeningGame = false;
        this.matchTargets = [];
        this.roleSkinIds = [];

        this.readyBtn.active = true;
        this.readyedBtn.active = false;
        this.refreshTimeLab();

        let roleNodes = this.roleLayout.children;
        for (let i = 0; i < roleNodes.length; i++) {
            let roleImg = roleNodes[i].getChildByName("roleImg")?.getComponent(Sprite);
            if (roleImg && this.unknownRoleSpriteFrame) {
                roleImg.spriteFrame = this.unknownRoleSpriteFrame;
            }
            let selectNode = roleNodes[i].getChildByName("select");
            if (selectNode) {
                selectNode.active = false;
            }
        }

        let enemyImg = this.enemyItem.getChildByName("roleImg")?.getComponent(Sprite);
        if (enemyImg && this.unknownRoleSpriteFrame) {
            enemyImg.spriteFrame = this.unknownRoleSpriteFrame;
        }

        if (roleNodes.length <= 0) {
            console.error("匹配界面没有角色位置");
            return;
        }

        // 玩家进入界面后立即随机到六个位置中的一个。
        let playerIndex = ccTools.getRandomNum(0, roleNodes.length);
        let playerNode = roleNodes[playerIndex];
        let playerImg = playerNode.getChildByName("roleImg")?.getComponent(Sprite);
        if (playerImg) {
            ccTools.loadImg(playerImg, imgPath.roleBodyFull + pData.skinId);
        }
        let playerSelect = playerNode.getChildByName("select");
        if (playerSelect) {
            playerSelect.active = true;
        }

        let roleIndex = 0;
        for (let i = 0; i < roleNodes.length; i++) {
            if (i == playerIndex) {
                continue;
            }
            this.matchTargets.push({
                node: roleNodes[i],
                type: "role",
                roleIndex: roleIndex++,
            });
        }
        this.matchTargets.push({ node: this.enemyItem, type: "enemy" });
        ccTools.shuffleArray(this.matchTargets);

        this.isMatching = this.matchTargets.length > 0;
        if (this.isMatching) {
            this.currentMatchDelay = this.getRandomMatchDelay();
        }
    }

    protected update(dt: number): void {
        if (!this.isMatching) {
            return;
        }

        this.matchTime += dt;
        this.currentMatchDelay -= dt;
        this.refreshTimeLab();

        if (this.currentMatchDelay > 0) {
            return;
        }

        this.finishCurrentMatch();
        this.currentMatchIndex++;
        if (this.currentMatchIndex >= this.matchTargets.length) {
            this.isMatching = false;
            this.tryOpenGame();
            return;
        }

        this.currentMatchDelay = this.getRandomMatchDelay();
    }

    /**随机一个单项匹配等待时间 */
    private getRandomMatchDelay() {
        let min = Math.max(0, Number(configData.roleMatchTime?.[0]) || 0);
        let max = Math.max(min, Number(configData.roleMatchTime?.[1]) || min);
        return min + Math.random() * (max - min);
    }

    /**完成当前人机或敌人的匹配 */
    private finishCurrentMatch() {
        let target = this.matchTargets[this.currentMatchIndex];
        let roleImg = target?.node.getChildByName("roleImg")?.getComponent(Sprite);
        if (!target || !roleImg) {
            return;
        }

        if (target.type == "enemy") {
            this.enemySkinId = ccTools.getRandomNum(0, configData.enemySkinCount);
            ccTools.loadImg(roleImg, imgPath.enemyBodyFull + this.enemySkinId);
            return;
        }

        let skinData = roleSkinConfig.roleSkinAllData || [];
        let skinId = skinData.length > 0
            ? skinData[ccTools.getRandomNum(0, skinData.length)].skinId
            : ccTools.getRandomNum(0, configData.roleSkinCount);
        this.roleSkinIds[target.roleIndex] = skinId;
        ccTools.loadImg(roleImg, imgPath.roleBodyFull + skinId);
    }

    /**刷新匹配耗时，匹配完成后不再调用以保持最终时间 */
    private refreshTimeLab() {
        this.timeLab.string = this.matchTime < 1
            ? "匹配中..."
            : `匹配中${Math.floor(this.matchTime)}s`;
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.readyBtn.addComponent(zoomButton).onClick = this.clickReadyBtn.bind(this);
    }

    openGame() {
        uiMgr.startGame({
            roleSkinIds: this.roleSkinIds.concat(),
            enemySkinId: this.enemySkinId,
        });
        this.onClose();
    }

    /**准备和全部人机匹配完成后进入游戏 */
    private tryOpenGame() {
        if (!this.isReady || this.isMatching || this.isOpeningGame) {
            return;
        }
        this.isOpeningGame = true;
        this.openGame();
    }

    ///
    ///点击事件
    ///

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
    }

    /**点击准备 */
    clickReadyBtn() {
        if (this.isReady) {
            return;
        }
        this.isReady = true;
        this.readyBtn.active = false;
        this.readyedBtn.active = true;
        this.tryOpenGame();
    }

    onUI_Close() {
        this.isMatching = false;
    }

    onClose() {
        uiMgr.closePage(UIPath.UIMatch);
    }
}
