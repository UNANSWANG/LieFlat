import { _decorator, Component, instantiate, macro, Node, NodePool } from 'cc';
import { uiMgr } from './UIManager';
const { ccclass, property } = _decorator;

//对象池管理类
@ccclass('poolManager')
export class poolManager extends Component {
    /**生产提示对象池 */
    produceTipsPool: NodePool = new NodePool();
    /**子弹对象池 */
    bulletPool: NodePool = new NodePool();

    /**初始化点的对象池 */
    initPointNodePool() {
        
    }
}

export let poolMgr = new poolManager();

