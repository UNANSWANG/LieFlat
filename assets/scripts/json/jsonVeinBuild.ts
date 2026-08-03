import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonVeinBuild')
export class jsonVeinBuild extends jsonBase {
    /** 表格名称 */
    tableName: string = "veinBuild";
    protected jsonPath: string = "json/veinBuild";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    /**表格处理 */
    protected processTableData() {
        super.processTableData();
    }

    
}
export let veinBuildConfig = new jsonVeinBuild();

export interface JsonVeinData {
    /**最小数量 */
    minNum: number;
    /**最大数量 */
    maxNum?: number;
    /**概率 */
    probability: string;
}


