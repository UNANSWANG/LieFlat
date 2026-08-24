import { _decorator, Component, Label, Node, Enum } from 'cc';
import { pData } from '../manager/playerData';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
import { uiMgr } from '../manager/UIManager';
const { ccclass, property } = _decorator;

enum monetaryType {
    /**感染币 */
    money = 0,
    /**碎片数量 */
    debris = 1,
}

@ccclass('monetaryController')
export class monetaryController extends Component {
    /**货币类型 */
    @property({
        type: Enum(monetaryType),
        tooltip: "货币类型",
    })
    monetaryType: monetaryType = monetaryType.money;

    numLabel: Label = null;
    img: Node = null;

    protected onLoad(): void {
        this.numLabel = this.node.getChildByName("numLab").getComponent(Label);
        this.img = this.node.getChildByName("img");
        this.refreshNum();
    }

    protected onEnable(): void {
        gm.Event.on(GameEvent.refreshPlayerMonetary, this.refreshNum, this);
        //延后一帧等待widget刷新后再刷坐标
        this.scheduleOnce(() => {
            this.refreshTargetPos();
        }, 0);
    }

    protected onDisable(): void {
        gm.Event.off(GameEvent.refreshPlayerMonetary, this.refreshNum, this);
    }

    /**刷新货币的世界坐标 */
    private refreshTargetPos() {
        if (this.monetaryType == monetaryType.debris) {
            uiMgr.debrisTargetPos.set(this.img.worldPosition);
        } else {
            uiMgr.moneyTargetPos.set(this.img.worldPosition);
        }
    }

    /**刷新货币 */
    private refreshNum() {
        if (this.monetaryType == monetaryType.debris) {
            this.numLabel.string = pData.debris.toString();
        } else {
            this.numLabel.string = pData.money.toString();
        }
    }
}


