import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
const { ccclass, property } = _decorator;

@ccclass('jsonProps')
export class jsonProps extends jsonBase {
    /** 表格名称 */
    tableName: string = "props";
    protected jsonPath: string = "json/props";
    protected tableUrl1: string = "";
    protected tableUrl2: string = "";

    private propsData: JsonPropsData[][] = [];

    /**表格处理 */
    protected processTableData() {
        super.processTableData();
        for (let i = 0; i < this.data.length; i++) {
            let data = this.data[i];
            if (this.propsData.hasOwnProperty(data.propsType)) {
                this.propsData[data.propsType].push(data);
            } else {
                this.propsData[data.propsType] = [data];
            }
        }
        console.warn("-------->初始化道具分类型数据:\n",this.propsData);
    }

    /**获取指定类型道具数据 */
    getPropsData(propsType: string): JsonPropsData[] {
        if (!propsType) {
            return this.data || [];
        }

        return this.propsData[propsType];
    }

    /**获取全部道具数据 */
    getAllTable(): JsonPropsData[][] {
        if (!this.propsData) {
            return [];
        }
        return this.propsData;
    }
}
export let propsConfig = new jsonProps();

interface JsonPropsData {
    /**道具类型(标识符) */
    propsType: string;
    /**建筑类型 */
    buildType: number;
    /**描述 */
    desc: string;
    /**名称 */
    name: string;
    /**所需金币 */
    coin: number;
    /**所需电能 */
    power: number;
    /**前置条件 */
    preConditions: string;
    /**血量 */
    hp: number;
    /**产出金币 */
    produceCoin: number;
    /**产出电能 */
    producePower: number;
    /**攻击力 */
    attack: number;
    /**攻击距离 */
    attackRange: number;
}


