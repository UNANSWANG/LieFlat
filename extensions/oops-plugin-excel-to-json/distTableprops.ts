
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class Tableprops {
    static TableName: string = "props";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(Tableprops.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 道具类型(标识符) */
    get propsType(): string {
        return this.data.propsType;
    }
    /** 建筑类型 */
    get buildType(): number {
        return this.data.buildType;
    }
    /** 描述 */
    get desc(): string {
        return this.data.desc;
    }
    /** 名称 */
    get name(): string {
        return this.data.name;
    }
    /** 所需金币 */
    get coin(): number {
        return this.data.coin;
    }
    /** 产出金币 */
    get produceCoin(): number {
        return this.data.produceCoin;
    }
    /** 前置条件 */
    get preConditions(): string {
        return this.data.preConditions;
    }
    /** 所需电能 */
    get power(): number {
        return this.data.power;
    }
    /** 血量 */
    get hp(): number {
        return this.data.hp;
    }
    /** 产出电能 */
    get producePower(): number {
        return this.data.producePower;
    }
    /** 攻击力 */
    get attack(): number {
        return this.data.attack;
    }
    /** 攻击距离 */
    get attackRange(): number {
        return this.data.attackRange;
    }
    /** 是否随机生成 */
    get isRandom(): number {
        return this.data.isRandom;
    }
    /** 建造上限 */
    get builNumMax(): number {
        return this.data.builNumMax;
    }
}
    