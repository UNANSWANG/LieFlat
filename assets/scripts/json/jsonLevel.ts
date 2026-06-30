import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonLevel')
export class jsonLevel extends jsonBase {
    /** 表格名称 */
    tableName: string = "levelTable";
    protected jsonPath: string = "json/levelTable";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    get tableData() : JsonLevelData[]{
        return this.data;
    }
}
export let levelConfig = new jsonLevel();

interface JsonLevelData {
    /**关卡数据 */
    levelData: string;
}