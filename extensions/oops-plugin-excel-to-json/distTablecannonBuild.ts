
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TablecannonBuild {
    static TableName: string = "cannonBuild";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TablecannonBuild.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 索引 */
    get idx(): number {
        return this.data.idx;
    }
    /** 最小数量 */
    get minNum(): number {
        return this.data.minNum;
    }
    /** 最大数量 */
    get maxNum(): number {
        return this.data.maxNum;
    }
    /** 判定时间 */
    get time(): number {
        return this.data.time;
    }
}
    