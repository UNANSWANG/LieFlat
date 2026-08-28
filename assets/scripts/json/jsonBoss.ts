import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
import { gm } from '../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('jsonBoss')
export class jsonBoss extends jsonBase {
    /** 表格名称 */
    tableName: string = "boss";
    protected jsonPath: string = "json/boss";
    protected tableUrl1: string = "https://cdn.taozigame.com/lt/config/8/boss.json";
    protected tableUrl2: string = "";

    /**表格处理 */
    protected processTableData() {
        super.processTableData();
        for(let i = 0; i < this.data.length; i++){
            let data : JsonBossData = this.data[i];
            if(data.attack){
                data.attack = Math.round(data.attack);
            }
            if(data.attackExp){
                data.attackExp = Math.round(data.attackExp);
            }
        }
    }

    /**Boss等级配置 */
    get tableData(): JsonBossData[] {
        return this.data || [];
    }

    /**根据等级获取Boss配置，等级从1开始 */
    getBossData(level: number): JsonBossData {
        let targetLevel = Math.floor(Number(level));
        if (!Number.isFinite(targetLevel) || targetLevel <= 0) {
            return null;
        }

        return this.tableData.find(data => Number(data?.quantity) == targetLevel) || null;
    }

}
export let bossConfig = new jsonBoss();

export interface JsonBossData {
    /**感染者等级 */
    quantity: number;
    /**血量 */
    hp: number;
    /**攻击力 */
    attack: number;
    /**升级所需经验值 */
    upgradeExp?: number;
    /**每次攻击获得经验值 */
    attackExp: number;
    /**技能解锁所需经验值 */
    skillUnlock: number;
    /**技能冷却时间 */
    skillCooldownTime: number;
}


