import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonEnemy')
export class jsonEnemy extends jsonBase {
    /** 表格名称 */
    tableName: string = "enemy";
    protected jsonPath: string = "json/enemy";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    /**获取敌人数据 */
    get enemyAllData() : JsonEnemyData[]{
        return this.data;
    }

    /**获取指定等级敌人数据 */
    getEnemyData(level: number): JsonEnemyData {
        if (!this.data) {
            return null;
        }

        if(level >= this.data.length){
            level = this.data.length - 1;
        }
        return this.data[level];
    }
}
export let enemyConfig = new jsonEnemy();

interface JsonEnemyData {
    /**等级 */
    level: number;
    /**血量 */
    hp: number;
    /**攻击力 */
    attack: number;
    /**升级最少时间 */
    upgradeTimeMin: number;
    /**升级最大时间 */
    upgradeTimeMax: number;
}



