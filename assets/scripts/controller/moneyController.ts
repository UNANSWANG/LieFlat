import { _decorator, Component, Label, Node } from 'cc';
import { pData } from '../manager/playerData';
import { gm } from '../manager/gm';
import { GameEvent } from '../manager/configData';
const { ccclass, property } = _decorator;

@ccclass('moneyController')
export class moneyController extends Component {
    numLabel: Label = null;

    protected onLoad(): void {
        this.numLabel = this.node.getChildByName("numLab").getComponent(Label);
        this.refreshMoney();
    }

    protected onEnable(): void {
        gm.Event.on(GameEvent.refreshPlayerMonetary, this.refreshMoney, this);
    }

    protected onDisable(): void {
        gm.Event.off(GameEvent.refreshPlayerMonetary, this.refreshMoney, this);
    }

    /**刷新货币 */
    private refreshMoney() {
        this.numLabel.string = pData.money.toString();
    }
}