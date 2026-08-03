
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablerobotDifficulty {
    static TableName: string = "robotDifficulty";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablerobotDifficulty.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 难度类型 */
    get type(): number {
        return this.data.type;
    }
    /** 概率0 */
    get probability0(): string {
        return this.data.probability0;
    }
    /** 概率1 */
    get probability1(): string {
        return this.data.probability1;
    }
    /** 概率2 */
    get probability2(): string {
        return this.data.probability2;
    }
    /** 概率3 */
    get probability3(): string {
        return this.data.probability3;
    }
    /** 概率4 */
    get probability4(): string {
        return this.data.probability4;
    }
    /** 概率5 */
    get probability5(): string {
        return this.data.probability5;
    }
}
    