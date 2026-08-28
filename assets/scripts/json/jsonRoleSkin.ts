import { _decorator, Component, Node } from 'cc';
import { jsonBase } from './jsonBase';
import { pData } from '../manager/playerData';
const { ccclass, property } = _decorator;

@ccclass('jsonRoleSkin')
export class jsonRoleSkin extends jsonBase {
    /** 表格名称 */
    tableName: string = "roleSkin";
    protected jsonPath: string = "json/roleSkin";
    protected tableUrl1: string = "https://cdn.taozigame.com/lt/config/8/roleSkin.json";
    protected tableUrl2: string = "";

    roleSkinAllData: JsonRoleSkinData[] = [];
    enemySkinAllData: JsonRoleSkinData[] = [];

    isInit = false;
    _defaultSkinId: number = 0;
    _defaultEnemySkinId: number = 0;
    get defaultSkinId(): number {
        if (!this.isInit) {
            this.calcDefaultSkinIds();
        }
        return this._defaultSkinId;
    }
    /**敌人皮肤默认id（type=1 且 isDefault=1 的那条） */
    get defaultEnemySkinId(): number {
        if (!this.isInit) {
            this.calcDefaultSkinIds();
        }
        return this._defaultEnemySkinId;
    }

    /**根据皮肤id获取皮肤数据（同时支持角色与敌人） */
    getSkinDataById(skinId: number, mode: number = 0): JsonRoleSkinData {
        let list = mode == 1 ? this.enemySkinAllData : this.roleSkinAllData;
        return list?.find((item) => item.skinId == skinId) || null;
    }

    /**遍历两张表，计算默认皮肤id */
    private calcDefaultSkinIds() {
        for (let i = 0; i < this.roleSkinAllData.length; i++) {
            let skin = this.roleSkinAllData[i];
            if (skin.isDefault == 1) {
                this._defaultSkinId = skin.skinId;
                break;
            }
        }
        for (let i = 0; i < this.enemySkinAllData.length; i++) {
            let skin = this.enemySkinAllData[i];
            if (skin.isDefault == 1) {
                this._defaultEnemySkinId = skin.skinId;
                break;
            }
        }
        this.isInit = true;
    }

    protected processTableData(): void {
        super.processTableData();
        this.roleSkinAllData = [];
        this.enemySkinAllData = [];
        this.isInit = false;
        for(let i = 0; i < this.data.length; i++){
            let item: JsonRoleSkinData = this.data[i];
            if(item.type == 0){
                this.roleSkinAllData.push(item);
            }else if(item.type == 1){
                this.enemySkinAllData.push(item);
            }
        }
        pData.initSkinData(this.defaultSkinId, this.defaultEnemySkinId);
    }
}
export let roleSkinConfig = new jsonRoleSkin();

export interface JsonRoleSkinData {
    /**类型 */
    type: number;
    /**皮肤id */
    skinId: number;
    /**名称 */
    name: string;
    /**是否为初始皮肤 */
    isDefault: number;
    /**获取条件 */
    limitType: number;
    /**购买所需金币（类型1） */
    money: number;
    /**通关次数（类型3） */
    levelNum: number;
}


