import { fromEvent, Observable } from 'rxjs';
import * as io from 'socket.io-client';
import { IGamestate, IKeyPair } from '../types';

export class SocketService {
    /* tslint:disable */
    private socket: SocketIOClient.Socket = {} as SocketIOClient.Socket;
    /* tslint:enable */

    public init(gamepin: string): SocketService {
        this.socket = io('/admin', { query: `gamepin=${gamepin}` });
        return this;
    }

    public onGameStateData(gamepin: string): Observable<IGamestate> {
        return fromEvent(this.socket, `gamestate-${gamepin}`);
    }

    public onUpdatedWinners(): Observable<IKeyPair> {
        return fromEvent(this.socket, `participants-winners`);
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
