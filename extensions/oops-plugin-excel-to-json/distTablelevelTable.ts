
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablelevelTable {
    static TableName: string = "levelTable";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablelevelTable.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 难度名称 */
    get name(): string {
        return this.data.name;
    }
    /** boss等级最大值 */
    get levelMax(): number {
        return this.data.levelMax;
    }
    /** 关卡数量 */
    get quantity(): number {
        return this.data.quantity;
    }
    /** boss血量（1级） */
    get hp(): number {
        return this.data.hp;
    }
    /** boss攻击力（1级） */
    get attack(): number {
        return this.data.attack;
    }
    /** 升级最小时间 */
    get upgradeTimeMin(): number {
        return this.data.upgradeTimeMin;
    }
    /** 升级最大时间 */
    get upgradeTimeMax(): number {
        return this.data.upgradeTimeMax;
    }
    /** 升级血量倍率 */
    get healthMultiplier(): number {
        return this.data.healthMultiplier;
    }
    /** 升级攻击力倍率 */
    get attackMultiplier(): number {
        return this.data.attackMultiplier;
    }
    /** 升级最小时间倍率 */
    get timeMinMultiplier(): number {
        return this.data.timeMinMultiplier;
    }
    /** 升级最大时间倍率 */
    get timeMaxMultiplier(): number {
        return this.data.timeMaxMultiplier;
    }
    /** 人机难度选择 */
    get AIdifficulty(): string {
        return this.data.AIdifficulty;
    }
}
    