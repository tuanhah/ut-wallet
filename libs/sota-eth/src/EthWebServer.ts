import util from 'util';
import { BaseWebServer, BlockchainPlatform, override, getLogger, EnvConfigRegistry } from 'sota-common';
import EthGateway from './EthGateway';

const logger = getLogger('EthWebServer');

export class EthWebServer extends BaseWebServer {
  public constructor() {
    super(BlockchainPlatform.Ethereum);
  }

  protected async getERC20TokenInfo(req: any, res: any) {
    const contractAddress = req.params.contract_address;
    const gateway = (await this.getGateway(this._currency.symbol)) as EthGateway;
    const tokenInfo = await gateway.getErc20TokenInfo(contractAddress);
    const result = Object.assign({}, tokenInfo, { network: EnvConfigRegistry.getNetwork() });
    res.json(result);
  }

  @override
  protected setup() {
    super.setup();

    this.app.get('/api/currency_config/:contract_address', async (req, res) => {
      try {
        await this.getERC20TokenInfo(req, res);
      } catch (e) {
        logger.error(`err=${util.inspect(e)}`);
        res.status(500).json({ error: e.message || e.toString() });
      }
    });
  }
}
