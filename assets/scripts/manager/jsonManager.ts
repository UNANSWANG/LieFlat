import { _decorator, Component, Node } from 'cc';
import { gm } from './gm';
import { GameEvent } from './configData';
import { propsConfig } from '../json/jsonProps';
import { commonConfig } from '../json/jsonCommon';
import { enemyConfig } from '../json/jsonEnemy';
import { robotUpgradeConfig } from '../json/jsonRobotUpgrade';
import { roleSkinConfig } from '../json/jsonRoleSkin';
const { ccclass, property } = _decorator;

@ccclass('jsonManager')
export class jsonManager  {
    /**表格数量 */
    tableNum = 5;
    /**已加载的表格数量 */
    tableLoadNum = 0;

    async load(){
        gm.Event.on(GameEvent.loadTable, this.loadCall, this);
        if(this.tableNum == 0){
            //没有表格直接加载完成
            gm.Event.emit(GameEvent.tableLoadComplete);
        }
        // levelConfig.initTable();
        propsConfig.initTable();
        commonConfig.initTable();
        enemyConfig.initTable();
        robotUpgradeConfig.initTable();
        roleSkinConfig.initTable();
    }

    loadCall(name: string){
        this.tableLoadNum++;
        if(this.tableLoadNum == this.tableNum){
            gm.Event.emit(GameEvent.tableLoadComplete);
        }
    }
}

export let jsonMgr = new jsonManager();



