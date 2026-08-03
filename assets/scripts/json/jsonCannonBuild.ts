import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
import { GameEvent } from '../manager/configData';
import { gm } from '../manager/gm';
const { ccclass, property } = _decorator;

@ccclass('jsonCannonBuild')
export class jsonCannonBuild extends jsonBase {
    /** 表格名称 */
    tableName: string = "cannonBuild";
    protected jsonPath: string = "json/cannonBuild";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    /**表格处理 */
    protected processTableData() {
        super.processTableData();
        
    }
}
export let cannonBuildConfig = new jsonCannonBuild();

interface JsonCannonBuildData {
    /**索引 */
    idx: number;
    /**最小数量 */
    minNum: number;
    /**最大数量 */
    maxNum: number;
    /**判定时间 */
    time: number;
}


