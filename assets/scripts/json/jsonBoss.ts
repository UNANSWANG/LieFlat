import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
import { gm } from '../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('jsonBoss')
export class jsonBoss extends jsonBase {
    /** 表格名称 */
    tableName: string = "boss";
    protected jsonPath: string = "json/boss";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    /**表格处理 */
    protected processTableData() {
        super.processTableData();
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


