import { _decorator, Node, Animation, ScrollView, Prefab, instantiate, Label, Color, Sprite, Layout, UITransform, Vec2 } from 'cc';
import { UIBase } from './UIBase';
import { imgPath, UIPath } from '../manager/pathConfig';
import { uiMgr } from '../manager/UIManager';
import { zoomButton } from '../extention/zoomButton';
import { levelConfig } from '../json/jsonLevel';
import { pData } from '../manager/playerData';
import { ccTools } from '../extention/generalTools';
const { ccclass, property } = _decorator;
@ccclass('UIDifficulty')
export class UIDifficulty extends UIBase {
    @property(Node)
    closeBtn: Node;

    @property(Node)
    startBtn: Node;

    @property(ScrollView)
    scrol: ScrollView;

    @property(Prefab)
    itemPre: Prefab;

    colorArr = ["#80BA72", "#FFCC50", "#D44D4D"];

    /**当前进度已解锁的最高难度索引 */
    private currentDifficultyIndex = 0;
    /**本次选择的难度索引 */
    private selectedDifficultyIndex = 0;
    /**是否正在打开匹配界面 */
    private isOpeningMatch = false;

    protected onLoad(): void {
        this.bindBtn();
    }

    onUI_Open() {
        let anim = this.getComponent(Animation);
        anim.play();
        this.initData();
    }

    initData() {
        this.isOpeningMatch = false;
        this.currentDifficultyIndex = Math.max(0, pData.getEnemyLevelTableIndex());
        this.selectedDifficultyIndex = pData.getSelectedDifficultyIndex();
        this.refreshDifficultyList();
    }

    /**刷新难度列表，已有节点只切换状态，不销毁 */
    private refreshDifficultyList() {
        let content = this.scrol?.content;
        let difficultyData = levelConfig.tableData || [];
        if (!content || difficultyData.length <= 0) {
            return;
        }

        this.currentDifficultyIndex = Math.min(this.currentDifficultyIndex, difficultyData.length - 1);
        this.selectedDifficultyIndex = Math.min(this.selectedDifficultyIndex, this.currentDifficultyIndex);
        let showCount = Math.min(this.currentDifficultyIndex + 2, difficultyData.length);

        for (let i = 0; i < content.children.length; i++) {
            content.children[i].active = false;
        }

        for (let i = 0; i < showCount; i++) {
            let item = content.children[i];
            if (!item) {
                item = instantiate(this.itemPre);
                content.addChild(item);
            }

            item.active = true;
            let isUnlocked = i <= this.currentDifficultyIndex;
            let colorIndex = Math.min(Math.floor(i / 3), this.colorArr.length - 1);
            let difficultyImg = item.children[0]?.getComponent(Sprite);
            if (difficultyImg) {
                ccTools.loadImg(difficultyImg, imgPath.difficultyItem + i);
            }
            let typeLab = item.getChildByName("typeLab")?.getComponent(Label);
            if (typeLab) {
                let modeName = difficultyData[i]?.name || `难度${i + 1}`;
                //已解锁模式显示“模式名-下一关序号”（如“初学-1”），未解锁仅显示模式名
                typeLab.string = isUnlocked ? (pData.getModeLevelName(i) || modeName) : modeName;
                typeLab.color = new Color(this.colorArr[colorIndex]);
            }

            let lockNode = item.getChildByName("lock");
            if (lockNode) {
                lockNode.active = !isUnlocked;
            }
            let selectNode = item.getChildByName("select");
            if (selectNode) {
                selectNode.active = isUnlocked && i == this.selectedDifficultyIndex;
            }

            let button = item.getComponent(zoomButton) || item.addComponent(zoomButton);
            //未解锁模式也可点击，点击后提示解锁条件
            button.interactable = true;
            button.onClick = this.clickDifficultyItem.bind(this, i);
        }

        this.centerSelectedItem();
    }

    /**列表布局完成后，将当前选中难度移动到视口中间 */
    private centerSelectedItem() {
        this.scheduleOnce(() => {
            if (!this.node.activeInHierarchy) {
                return;
            }

            let content = this.scrol?.content;
            let selectedItem = content?.children[this.selectedDifficultyIndex];
            let viewWidth = content?.parent?.getComponent(UITransform)?.width || 0;
            if (!content || !selectedItem || viewWidth <= 0) {
                return;
            }

            content.getComponent(Layout)?.updateLayout(true);
            let maxOffsetX = Math.max(0, this.scrol.getMaxScrollOffset().x);
            let targetOffsetX = Math.max(0, Math.min(selectedItem.position.x - viewWidth / 2, maxOffsetX));
            this.scrol.scrollToOffset(new Vec2(targetOffsetX, this.scrol.getScrollOffset().y), 0);
        }, 0);
    }

    /**选择已解锁难度，未解锁难度提示解锁条件 */
    private clickDifficultyItem(difficultyIndex: number) {
        if (difficultyIndex < 0) {
            return;
        }

        //未解锁模式：提示需要通关上一个模式的最大关卡
        if (difficultyIndex > this.currentDifficultyIndex) {
            this.showUnlockTips(difficultyIndex);
            return;
        }

        this.selectedDifficultyIndex = pData.setSelectedDifficultyIndex(difficultyIndex);
        let items = this.scrol.content.children;
        for (let i = 0; i < items.length; i++) {
            let selectNode = items[i].getChildByName("select");
            if (selectNode) {
                selectNode.active = items[i].active && i == this.selectedDifficultyIndex;
            }
        }
    }

    /**提示解锁条件（需要通过上一个模式的最大关卡） */
    private showUnlockTips(difficultyIndex: number) {
        let unlockLevelName = this.getUnlockLevelName(difficultyIndex);
        uiMgr.showTips(unlockLevelName ? `通过${unlockLevelName}解锁` : "该模式暂未解锁");
    }

    /**
     * 获取解锁指定模式需要通关的关卡名称，即上一个模式的最大关卡。
     * 例：简易模式的上一个模式“初学”只有1关，则返回“初学-1”。
     */
    private getUnlockLevelName(difficultyIndex: number): string {
        let difficultyData = levelConfig.tableData || [];
        let previousIndex = difficultyIndex - 1;
        let previousData = difficultyData[previousIndex];
        if (!previousData) {
            return "";
        }

        let quantity = Math.max(1, Math.floor(Number(previousData.quantity) || 1));
        return levelConfig.getLevelName([previousIndex, quantity]);
    }

    bindBtn() {
        this.closeBtn.addComponent(zoomButton).onClick = this.clickCloseBtn.bind(this);
        this.startBtn.addComponent(zoomButton).onClick = this.clickStartBtn.bind(this);
    }

    ///
    ///点击事件
    ///

    /**点击开始游戏 */
    clickStartBtn() {
        if (this.isOpeningMatch) {
            return;
        }

        this.isOpeningMatch = true;
        uiMgr.closePage(UIPath.UIDifficulty);
        uiMgr.openPage(UIPath.UIMatch);
    }

    /**点击关闭 */
    clickCloseBtn() {
        this.onClose();
        //难度页由关闭按钮退出时回到主页并恢复主页状态；开始游戏时不会调用这里。
        uiMgr.openPage(UIPath.UIMain);
    }

    onClose() {
        uiMgr.closePage(UIPath.UIDifficulty);
    }
}


