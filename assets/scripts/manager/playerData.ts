import { _decorator, math, Vec2, Vec3 } from 'cc';
import { levelConfig } from '../json/jsonLevel';
import { ccStorageTools } from '../extention/storageTools';
import { GameEvent, PropsName, SaveKey } from './configData';
import { gm, PlatType } from './gm';
import { httpMgr } from '../sdk/network/httpManager';
import { urlConfig } from '../sdk/network/netConfig';
const { ccclass, property } = _decorator;

//用户游戏内数据
@ccclass('playerData')
export class playerData {
    /**当前已通关关卡数 */
    level = 0;
    /**当前关卡的关卡数据 */
    levelData: jsonLevelData = null;
    /**道具集合 */
    propsNums = {};
    /**当前地图的大小 */
    mapSize: math.Size = math.Size.ZERO;
    /**地图半宽高 */
    mapHalfSize: Vec2 = Vec2.ZERO;
    /**玩家金币（场内） */
    gameCoin = 0;
    /**玩家电能（场内） */
    gamePower = 0;
    /**本局可使用广告升级门的次数 */
    adUpgradeDoorCount = 1;

    levelInit() {
        // let data = levelConfig.tableData[this.realyLevel];
        // this.levelData = JSON.parse(data.levelData);
        this.gameCoin = 0;
        this.gamePower = 0;
        this.adUpgradeDoorCount = 1;

        this.SDKReportLevel();
    }

    /**SDK关卡上报 */
    SDKReportLevel() {
        if (gm.hgSdk) {
            gm.hgSdk.track('LEVEL_ENTER', {
                enter_level_id: 0,	    //进入的关卡进度（ 0 ~ 1 之间的数值），需保留两位小数
                level_id: (pData.level + 1),    	//关卡ID，数值
            });
        }
    }

    /**上报关卡给后端 */
    reportLevel(isPass) {
        return;
        let progress = 0;
        //已经通关进度就是100%
        if (isPass) {
            progress = 100;
        } else {
            progress = 0;
        }

        let levelReprotData = {
            is_pass: isPass ? 1 : 0,
            level: this.level + 1,
            level_progress: progress,
        }

        //TODO 测试
        // console.warn("上报关卡给后端", levelReprotData);
        httpMgr.post(urlConfig.levelReport, levelReprotData);
    }

    /**循环后的实际关卡数（对应表格） */
    get realyLevel() {
        let totalLevels = levelConfig.tableData.length;
        const startIndex = 30;

        if (this.level < totalLevels) {
            return this.level;
        } else {
            // 从第30关开始循环
            return startIndex + ((this.level - startIndex) % (totalLevels - startIndex));
        }
    }

    /**增加用户关卡数 */
    addLevel() {
        //上报关卡完成
        this.reportLevel(true);
        this.level++;
        ccStorageTools.setData(SaveKey.level, this.level);

        //上传微信好友榜
        if (gm.platType === PlatType.wx) {
            const kvDataList = [];
            kvDataList.push({
                key: `level`,
                value: `${this.level}`
            });
            gm.API.setUserCloudStorage(kvDataList);
        }

    }

    /**修改局内金币 */
    fixGameCoin(coin: number) {
        this.gameCoin += coin;
        gm.Event.emit(GameEvent.refreshGameMonetary);
    }

    /**修改局内电能 */
    fixGamePower(power: number) {
        this.gamePower += power;
        gm.Event.emit(GameEvent.refreshGameMonetary);
    }

    /**设置道具数量 */
    setPropsNum(propsName: PropsName, num: number) {
        if (num < 0) {
            num = 0;
        }
        this.propsNums[propsName] = num;
        ccStorageTools.setData(SaveKey.props, this.propsNums);
        gm.Event.emit(GameEvent.refreshProps);
    }

    /**获取道具数量 */
    getPropsNum(propsName: PropsName) {
        return this.propsNums[propsName] || 0;
    }

    /**修改道具数量 */
    fixPropsNum(propsName: PropsName, num = 1, isRefresh = true) {
        let tempNum = this.propsNums[propsName] || 0;
        tempNum += num;
        if (tempNum < 0) {
            tempNum = 0;
        }
        this.propsNums[propsName] = tempNum;
        ccStorageTools.setData(SaveKey.props, this.propsNums);
        if (isRefresh) {
            gm.Event.emit(GameEvent.refreshProps);
        }
    }

    /**初始化道具集合 */
    initPropsNum() {
        this.propsNums = ccStorageTools.getData(SaveKey.props) || {};
    }
}

export let pData = new playerData();

interface jsonLevelData {
    /**关卡宽度 */
    width: number;
    /**关卡高度 */
    height: number;
    /**小箭头数据 */
    arrowData: any[];
    /**大箭头数据 */
    bigArrowData: any[];
    /**道具数据 */
    propsData: any[];
    /**边缘道具数据 */
    externalPropsData: any[];
}