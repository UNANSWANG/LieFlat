import { _decorator, AnimationClip, AssetManager, Component, instantiate, Node, Prefab, Sprite, tween, UITransform, Vec3 } from 'cc';
import { UIBase } from '../UIPage/UIBase';
import { animPath, gamePath, imgPath, ItemPath, mapNameArr, UIPath } from './pathConfig';
import { ccResTools } from '../extention/resTools';
import { tipsNotice } from '../UIPage/tips/tipsNotice';
import { pData } from './playerData';
import { ccTools } from '../extention/generalTools';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager {
    resBundle: AssetManager.Bundle = null;
    tipsPrefab: Prefab = null;
    produceTipsPrefab: Prefab = null;
    bulletPrefab: Prefab = null;
    effectItemPrefab: Prefab = null;
    gameSpriteItemPrefab: Prefab = null;
    gameSpineItemPrefab: Prefab = null;
    gameAnimItemPrefab: Prefab = null;
    airRedAnimClip: AnimationClip = null;
    airYellowAnimClip: AnimationClip = null;
    fogAnimClip: AnimationClip = null;

    private gamePage: Node = null;
    private uiPage: Node = null;
    private noticePage: Node = null;
    private effectNode: Node = null;

    private uiMap: Map<string, Node> = new Map();
    /**游戏资源预加载任务，防止匹配页重复打开时并发加载 */
    private gamePreloadPromise: Promise<void> = null;
    /**游戏资源是否已全部预加载 */
    private gamePreloadComplete = false;

    initData(node) {
        this.initPage(node);
    }

    initPage(parent) {
        this.gamePage = parent.getChildByName('Game');
        this.uiPage = parent.getChildByName('UI');
        this.noticePage = parent.getChildByName('Notice');
        this.effectNode = parent.getChildByName('Effect');
    }

    /**加载启动后各页面都可能使用的预制体 */
    async preLoadCommonPrefab() {
        if (this.tipsPrefab) {
            return;
        }
        if (!this.resBundle) {
            throw new Error("资源包尚未加载");
        }

        this.tipsPrefab = await ccResTools.loadPrefab(this.resBundle, ItemPath.tips, false);
        if (!this.tipsPrefab) {
            throw new Error(`加载预制体失败: ${ItemPath.tips}`);
        }
        this.effectItemPrefab = await ccResTools.loadPrefab(this.resBundle, ItemPath.effectItem, false);
    }

    /**预加载游戏页及游戏内使用的页面、预制体、动画和地图 */
    async preLoadGame() {
        if (this.gamePreloadComplete) {
            return;
        }
        if (this.gamePreloadPromise) {
            return this.gamePreloadPromise;
        }

        this.gamePreloadPromise = this.loadGameResources();
        try {
            await this.gamePreloadPromise;
            this.gamePreloadComplete = true;
        } catch (error) {
            this.gamePreloadPromise = null;
            throw error;
        }
    }

    /**执行游戏资源预加载 */
    private async loadGameResources() {
        if (!this.resBundle) {
            throw new Error("资源包尚未加载");
        }

        await Promise.all([
            this.preLoadPage(gamePath.UIGame),
            this.preLoadPage(UIPath.UIBuild),
            this.preLoadPage(UIPath.UIProps),
            this.preLoadPage(UIPath.UISuccess),
            this.preLoadPage(UIPath.UIFail),
            this.loadGamePrefab(),
            this.loadGameAnim(),
            this.loadGameMap(),
        ]);
    }

    /**加载游戏内动态创建的预制体 */
    private async loadGamePrefab() {
        let prefabs = await Promise.all([
            ccResTools.loadPrefab(this.resBundle, ItemPath.produceTips, false),
            ccResTools.loadPrefab(this.resBundle, ItemPath.bullet, false),
            ccResTools.loadPrefab(this.resBundle, ItemPath.gameSpriteItem, false),
            ccResTools.loadPrefab(this.resBundle, ItemPath.gameSpineItem, false),
            ccResTools.loadPrefab(this.resBundle, ItemPath.gameAnimItem, false),
        ]);

        if (prefabs.some((prefab) => !prefab)) {
            throw new Error("游戏预制体加载失败");
        }

        this.produceTipsPrefab = prefabs[0];
        this.bulletPrefab = prefabs[1];
        this.gameSpriteItemPrefab = prefabs[2];
        this.gameSpineItemPrefab = prefabs[3];
        this.gameAnimItemPrefab = prefabs[4];
    }

    /**加载游戏动画 */
    private async loadGameAnim() {
        let clips = await Promise.all([
            ccResTools.loadAnimationClip(this.resBundle, animPath.airRed, false),
            ccResTools.loadAnimationClip(this.resBundle, animPath.airYellow, false),
            ccResTools.loadAnimationClip(this.resBundle, animPath.fog, false),
        ]);

        if (clips.some((clip) => !clip)) {
            throw new Error("游戏动画加载失败");
        }

        this.airRedAnimClip = clips[0];
        this.airYellowAnimClip = clips[1];
        this.fogAnimClip = clips[2];
    }

    /**加载全部候选游戏地图 */
    private async loadGameMap() {
        let maps = await Promise.all(mapNameArr.map((mapName) => {
            return ccResTools.loadTiledMap(this.resBundle, ItemPath.tileMap + mapName, false);
        }));

        if (maps.some((mapAsset) => !mapAsset)) {
            throw new Error("游戏地图加载失败");
        }
    }

    /**显示提示 */
    showTips(str?) {
        let noticeItem = instantiate(this.tipsPrefab);
        this.noticePage.addChild(noticeItem);

        let notice = noticeItem.getComponent(tipsNotice);
        notice.initData(str);
    }

    /**开始游戏 */
    startGame(data?: any) {
        if (!this.resBundle) {
            return;
        }
        let keyName = this.getUIName(gamePath.UIGame);
        if (!this.uiMap.has(keyName)) {
            console.error("游戏页尚未预加载，无法开始游戏");
            return;
        }
        let gameNode = this.uiMap.get(keyName);
        gameNode.active = true;
        this.gamePage.addChild(gameNode);
        let uiComp = gameNode.getComponent(UIBase);
        uiMgr.closePage(UIPath.UIMain);
        uiComp.onUI_Open(data);
    }

    /**关闭游戏 */
    closeGame() {
        let keyName = this.getUIName(gamePath.UIGame);
        if (this.uiMap.has(keyName)) {
            let uiComp = this.uiMap.get(keyName).getComponent(UIBase);
            uiComp.onUI_Close();
            this.uiMap.get(keyName).active = false;
        }
        uiMgr.openPage(UIPath.UIMain);
    }

    /**预加载界面 */
    async preLoadPage(pagePath: string) {
        if (!this.resBundle) {
            throw new Error("资源包尚未加载");
        }
        let keyName = this.getUIName(pagePath);
        if (this.uiMap.has(keyName)) {
            return;
        }
        let pagePre = await ccResTools.loadPrefab(this.resBundle, pagePath);
        if (!pagePre) {
            throw new Error(`加载页面失败: ${pagePath}`);
        }
        let pageNode = instantiate(pagePre);
        this.uiMap.set(keyName, pageNode);
        pageNode.active = false;
    }

    /**打开界面 */
    async openPage(pagePath: string, data?: any) {
        if (!this.resBundle) {
            return;
        }
        let keyName = this.getUIName(pagePath);
        let pageNode = null;
        if (this.uiMap.has(keyName)) {
            pageNode = this.uiMap.get(keyName);
            this.uiPage.addChild(pageNode);
        } else {
            let pagePre = await ccResTools.loadPrefab(this.resBundle, pagePath);
            pageNode = instantiate(pagePre);
            this.uiPage.addChild(pageNode);
            this.uiMap.set(keyName, pageNode);
        }
        pageNode.active = true;
        let uiComp: UIBase = pageNode.getComponent(UIBase);
        uiComp.onUI_Open(data);
    }

    /**关闭界面 */
    closePage(pagePath: string) {
        let keyName = this.getUIName(pagePath);
        if (this.uiMap.has(keyName)) {
            let pageNode = this.uiMap.get(keyName);;
            let uiComp = pageNode.getComponent(UIBase);
            uiComp.onUI_Close();
            pageNode.active = false;
            //将自己移出父节点但不删除节点
            pageNode.removeFromParent();
        }
    }

    /**获取界面名称 */
    getUIName(str) {
        let strs = str.split('/');
        return strs[strs.length - 1];
    }

    /**货币动画目标位置(世界坐标) */
    moneyTargetPos: Vec3 = new Vec3();

    /**播放货币动画
     * @param rootNode 货币动画初始节点
     * @param num 货币数量
     */
    playMoneyAnim(rootNode: Node, num: number) {
        if (num <= 0) {
            return;
        }
        if (!rootNode || !rootNode.isValid || !this.effectNode || !this.effectNode.isValid
            || !this.effectItemPrefab || !this.resBundle) {
            pData.fixMoney(num);
            return;
        }

        let effectTransform = this.effectNode.getComponent(UITransform);
        if (!effectTransform) {
            pData.fixMoney(num);
            return;
        }

        let startCenter = effectTransform.convertToNodeSpaceAR(rootNode.worldPosition);
        let targetPos = effectTransform.convertToNodeSpaceAR(this.moneyTargetPos);
        if (!this.effectNode.isValid) {
            pData.fixMoney(num);
            return;
        }

        let itemCount = Math.min(Math.ceil(num / 10), 10);
        let completedCount = 0;

        for (let i = 0; i < itemCount; i++) {
            let effectItem = instantiate(this.effectItemPrefab);
            this.effectNode.addChild(effectItem);

            let randomAngle = Math.random() * Math.PI * 2;
            let randomRadius = Math.sqrt(Math.random()) * 100;
            effectItem.setPosition(
                startCenter.x + Math.cos(randomAngle) * randomRadius,
                startCenter.y + Math.sin(randomAngle) * randomRadius,
                startCenter.z,
            );
            effectItem.setScale(2, 2, 1);

            let sprite = effectItem.getComponent(Sprite);
            if (sprite) {
                ccTools.loadImg(sprite, imgPath.money);
            }

            tween(effectItem)
                .delay(i * 0.05)
                .to(0.5, { position: targetPos, scale: new Vec3(1, 1, 1) }, { easing: 'quadIn' })
                .call(() => {
                    effectItem.destroy();
                    completedCount++;
                    if (completedCount === itemCount) {
                        pData.fixMoney(num);
                    }
                })
                .start();
        }
    }
}
export let uiMgr = new UIManager();
