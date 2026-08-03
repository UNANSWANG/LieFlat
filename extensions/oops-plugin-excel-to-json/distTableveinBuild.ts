
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

export class TableveinBuild {
    static TableName: string = "veinBuild";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableveinBuild.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 最小数量 */
    get minNum(): number {
        return this.data.minNum;
    }
    /** 最大数量 */
    get maxNum(): number {
        return this.data.maxNum;
    }
    /** 概率 */
    get probability(): string {
        return this.data.probability;
    }
}
    