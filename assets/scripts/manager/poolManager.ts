import { _decorator, Component, instantiate, Node, NodePool, Prefab, Sprite, Tween, UIOpacity, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

//对象池管理类
@ccclass('poolManager')
export class poolManager extends Component {
    /**生产提示对象池 */
    produceTipsPool: NodePool = new NodePool();
    /**子弹对象池 */
    bulletPool: NodePool = new NodePool();
    /**游戏节点对象池 */
    gameNodePool: NodePool = new NodePool();
    /**瓦片对象池 */
    tileItemPool: NodePool = new NodePool();
    /**道具节点对象池 */
    propsNodePool: NodePool = new NodePool();

    /**初始化点的对象池 */
    initPointNodePool() {
        
    }

    /**获取游戏通用节点 */
    getGameNode(prefab: Prefab) {
        return this.getNode(this.gameNodePool, prefab);
    }

    /**回收游戏通用节点 */
    putGameNode(node: Node) {
        this.resetNode(node, true);
        this.gameNodePool.put(node);
    }

    /**获取瓦片节点 */
    getTileItem(prefab: Prefab) {
        return this.getNode(this.tileItemPool, prefab);
    }

    /**回收瓦片节点 */
    putTileItem(node: Node) {
        this.resetNode(node);
        this.tileItemPool.put(node);
    }

    /**获取道具节点 */
    getPropsNode(prefab: Prefab) {
        return this.getNode(this.propsNodePool, prefab);
    }

    /**回收道具节点 */
    putPropsNode(node: Node) {
        this.resetNode(node);
        this.propsNodePool.put(node);
    }

    /**从指定对象池获取节点 */
    private getNode(pool: NodePool, prefab: Prefab) {
        let node = pool.get();
        if (!node) {
            node = instantiate(prefab);
        }

        node.active = true;
        return node;
    }

    /**通用节点复原 */
    private resetNode(node: Node, clearRootSprite: boolean = false) {
        if (!node || !node.isValid) {
            return;
        }

        this.resetNodeTree(node, true, clearRootSprite);
        node.removeFromParent();
        node.active = false;
    }

    /**递归停止动画、计时器并恢复运行时常改动状态 */
    private resetNodeTree(node: Node, isRoot: boolean = false, clearRootSprite: boolean = false) {
        Tween.stopAllByTarget(node);
        if (isRoot) {
            node.setPosition(Vec3.ZERO);
            node.setScale(Vec3.ONE);
            node.angle = 0;
            node.getComponent(UITransform)?.setAnchorPoint(0.5, 0.5);
        }

        let comps = node.getComponents(Component) || [];
        for (let i = 0; i < comps.length; i++) {
            let comp: any = comps[i];
            comp.unscheduleAllCallbacks?.();
            Tween.stopAllByTarget(comp);
        }

        let opacity = node.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 255;
        }

        let sprite = isRoot && clearRootSprite ? node.getComponent(Sprite) : null;
        if (sprite) {
            sprite.spriteFrame = null;
        }

        for (let i = 0; i < node.children.length; i++) {
            this.resetNodeTree(node.children[i]);
        }
    }
}

export let poolMgr = new poolManager();

