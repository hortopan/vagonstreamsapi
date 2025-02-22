const API_BASE_URL = `https://api.vagon.io`;
import crypto from 'crypto';

export class VagonStreamsAPI {

    config: Configuration;

    /**
     * @constructor
     * @param config.api_key API key
     * @param config.api_secret API secret
     * @param config.request_timeout Request timeout in milliseconds
     * @throws Error if API key or secret is not provided
     */
    constructor(config: Configuration) {
        if (!config?.api_key || !config?.api_secret) {
            throw new ConfigurationError('API key and secret are required');
        }

        this.config = config;
    }

    private async request(method: keyof typeof Request_method, endpoint: string, data?: { [index: string]: any }) {
        const url = new URL(`${API_BASE_URL}${endpoint}`);

        let requestBody = '';

        if (method === 'GET') {
            if (data !== undefined) {
                for (const key in data) {
                    url.searchParams.append(key, data[key]);
                }
            }
        } else {
            requestBody = data !== undefined ? JSON.stringify(data) : '';
        }

        const nonce = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now().toString();
        const requestPath = url.pathname;

        const payload = `${this.config.api_key}${method.toUpperCase()}${requestPath}${timestamp}${nonce}${requestBody}`;

        const signature = crypto.createHmac('sha256', this.config.api_secret)
            .update(payload)
            .digest('hex');

        const headers: { [index: string]: string } = {
            'Authorization': `HMAC ${this.config.api_key}:${signature}:${nonce}:${timestamp}`
        };

        if (method !== 'GET' && data !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        const options = {
            method: method,
            headers,
            body: method !== 'GET' ? requestBody : undefined,
            signal: this.config.request_timeout ? AbortSignal.timeout(this.config.request_timeout) : undefined,
        };


        const response = await fetch(url, options);

        if (!response.ok) {
            const body = await response.text();
            throw new HTTP_Error(response.status, body);
        }

        return response.json();
    }

    public async application_list(page = 1, per_page = 100): Promise<ApplicationListResponse> {
        return this.request(Request_method.GET, '/app-stream-management/v2/applications', {
            page,
            per_page
        });
    }

    public async application_config_set(application_id: string, config: ApplicationConfigurationSet) {
        return this.request(Request_method.PUT, `/app-stream-management/v2/applications/${application_id}`, config);
    }

    public async stream_list(application_id: string, page = 1, per_page = 100): Promise<StreamListResponse> {
        return this.request(Request_method.GET, '/app-stream-management/v2/streams', {
            application_id,
            page,
            per_page
        });
    }

    public async stream_create(application_id: string, config: StreamCreatePayload): Promise<StreamCreateResponse> {
        return this.request(Request_method.POST, '/app-stream-management/v2/streams', {
            application_id,
            config
        });
    }

    public async stream_pause(stream_id: string): Promise<SteamStatusChangeResponse> {
        return this.request(Request_method.PUT, `/app-stream-management/v2/streams/${stream_id}/pause`);
    }

    public async stream_activate(stream_id: string): Promise<SteamStatusChangeResponse> {
        return this.request(Request_method.PUT, `/app-stream-management/v2/streams/${stream_id}/activate`);
    }

    public async stream_delete(stream_id: string): Promise<SteamStatusChangeResponse> {
        return this.request(Request_method.DELETE, `/app-stream-management/v2/streams/${stream_id}`);
    }

    public async stream_config_get(stream_id: string): Promise<StreamConfigResponse> {
        return this.request(Request_method.GET, `/app-stream-management/v2/streams/${stream_id}/config`);
    }

    public async stream_config_set(stream_id: string, config: StreamConfig) {
        return this.request(Request_method.PUT, `/app-stream-management/v2/streams/${stream_id}/config`, config);
    }

    public async machine_list(stream_id: string): Promise<MachinesListResponse> {
        return this.request(Request_method.GET, `/app-stream-management/v2/streams/${stream_id}/machines`);
    }

    public async machine_start(stream_id: string): Promise<SteamMachineStatusChangeResponse> {
        return this.request(Request_method.POST, `/app-stream-management/v2/streams/${stream_id}/start-machine`);
    }

    public async machine_stop(stream_id: string, machine_id: string): Promise<CoreApiResponse> {
        return this.request(Request_method.POST, `/app-stream-management/v2/streams/${stream_id}/stop-machine`, {
            machine_id
        });
    }

    public async machine_assign(stream_id: string, region: Region, user_id?: string): Promise<MachineAssignResponse> {
        return this.request(Request_method.POST, `/app-stream-management/v2/streams/${stream_id}/assign-machine`, {
            region,
            user_id
        })
    }

    public async stream_machine_get(machine_id: string): Promise<MachineGetResponse> {
        return this.request(Request_method.GET, `/app-stream-management/v2/machines/${machine_id}`)
    }

    public async stream_machine_stats(page = 1, per_page = 20, query?: MachineStatsQuery): Promise<MachineStatsResponse> {
        return this.request(Request_method.GET, `/app-stream-management/v2/machines`, query)
    }

    public async user_create(email: string): Promise<UserCreateApiResponse> {
        return this.request(Request_method.POST, `/app-stream-management/v2/users`, {
            email
        })
    }

    public async user_remove(user_id: string): Promise<CoreApiResponse> {
        return this.request(Request_method.DELETE, `/app-stream-management/v2/users/${user_id}`)
    }

    public async visitor_session_stats(page = 1, per_page = 20, query?: MachineStatsQuery): Promise<any> {
        return this.request(Request_method.GET, `/app-stream-management/v2/sessions`, query)
    }

}

export default VagonStreamsAPI;

export enum Request_method {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export interface Configuration {
    api_key: string;
    api_secret: string;
    request_timeout?: number;
}

export enum Resolution {
    auto = 'res_scale',
    res_720p = 'res_720p',
    res_1080p = 'res_1080p',
    res_2160p = 'res_2160p',
}

export enum Sound {
    off = 'off',
    activate_on_start = 'activate_on_start',
    user_can_activate = 'user_can_activate',
}

export enum Microphone {
    off = 'off',
    activate_on_start = 'activate_on_start',
    user_can_activate = 'user_can_activate',
}

export enum DurationAutoTurnOff {
    off = 'off',
    immediately = 'immediately',
    '2_min' = '2_min',
    '5_min' = '5_min',
    '30_min' = '30_min',
    '1_hour' = '1_hour',
    '3_hour' = '3_hour',
    '6_hour' = '6_hour',

}


export enum DurationMaximumSession {
    off = 'off',
    '5_min' = '5_min',
    '10_min' = '10_min',
    '15_min' = '15_min',
    '30_min' = '30_min',
    '1_hour' = '1_hour',
}

export enum DurationIdle {
    'off' = 'off',
    '1_min' = '1_min',
    '5_min' = '5_min',
    '10_min' = '10_min',
}

export enum DockPosition {
    left = 'left',
    right = 'right',
    top = 'top',
    bottom = 'bottom',
}

export enum CapacityType {
    on_demand = 'on_demand',
    balanced = 'balanced',
    always_on = 'always_on',
}

export enum Region {
    dublin = 'dublin',
    north_virginia = 'north_virginia',
    oregon = 'oregon',
    ohio = 'ohio',
    montreal = 'montreal',
    california = 'california',
    sao_paolo = 'sao_paolo',
    stockholm = 'stockholm',
    frankfurt = 'frankfurt',
    bahrain = 'bahrain',
    mumbai = 'mumbai',
    seoul = 'seoul',
    tokyo = 'tokyo',
    singapore = 'singapore',
    sydney = 'sydney',
    jakarta = 'jakarta',
    uae = 'uae',
    cape_town = 'cape_town',
    hong_kong = 'hong_kong',
}

export interface Capacity {
    region: Region;
    total_capacity: number;
}

export enum GameEngine {
    unity = 'unity',
    unreal = 'unreal',
}

export interface StreamConfig {
    resolution: Resolution
    sound: Sound,
    microphone: Microphone,
    auto_turn_off_duration: DurationAutoTurnOff,
    maximum_session_duration: DurationMaximumSession,
    idle_duration: DurationIdle,
    launch_arguments: string,
    dark_mode: boolean,
    collect_info: boolean,
    password: string,
    password_protection: string,
    dock_position: DockPosition,
    keyboard_layout: string,
    user_session_data: boolean,
    boost_enabled: boolean,
    pixel_streaming_enabled: boolean,
    port_access_enabled: boolean,
    capacity_type: CapacityType,
    capacities?: Array<Capacity>,
    restart_application: boolean,
    auto_start_application: boolean,
    collect_application_logs: boolean,
    game_engine: GameEngine,
    project_name: string,
    company_name: string,
    product_name: string,
    region_optimization: boolean,
    show_play_page: boolean,
}

export interface ExecutableAttributes {
    executable_name: string;
    launch_arguments: string | null;
    restart_arguments: string | null;
    file: string;
    version: number;
    active: boolean;
    created_at: string;
    images: Array<any>;
}

export interface Executable {
    id: string;
    type: string;
    attributes: ExecutableAttributes;
}

export interface ApplicationAttributes {
    name: string;
    status: string;
    banner_url: string | null;
    logo_url: string | null;
    friendly_status: string;
    os: string;
    active_executable: Executable;
}

export interface Application {
    id: string,
    type: string,
    attributes: ApplicationAttributes,
    performance: string;
    enterprise: any;
    pro: any;
}

export interface StreamConfigResponseAttributes extends StreamConfig {
    texts: { [index: string]: string };
    application: Application
}

export interface StreamConfigResponse extends CoreApiResponse {
    id: string;
    type: string;
    config: StreamConfig;
    attributes: StreamConfigResponseAttributes;
    timestamp: string;
    client_code: number;
}

export interface CoreApiResponse {
    client_code: number;
    timestamp: string;
}

export interface ApplicationListResponse extends CoreApiResponse {
    applications: Array<Application>;
    count: number;
    page: number;
}

export interface StreamListResponse extends CoreApiResponse {
    streams: Array<any>;
    count: number;
    page: number;
}

export interface SteamStatusChangeResponse extends CoreApiResponse {
    id: string,
    type: string,
    attributes: {
        status: string,
    }
}

export interface StreamCreatePayload {
    application_id: string;
    capacities: Array<Capacity>;
    capacity_type: CapacityType;
}

export interface StreamCreateResponse extends CoreApiResponse {
    id: string,
    type: string,
    attributes: {
        status: string,
        application_id: string,
    }
}

export interface MachineAttributes {
    start_at: string;
    status: string;
    end_at: string;
    friendly_status: string;
    connection_status: string;
    region: Region;
    uid: string;
    cost: number;
    duration: number;
    application_name: string;
    application_id: string;
    stream_id: string;
    stream_name: string;
    machine_type: string;
    public_ip_address: string | null;
}

export interface Machine {
    id: string;
    type: string;
    attributes: MachineAttributes;
}

export interface MachinesListResponse extends CoreApiResponse {
    machines: Array<Machine>;
    count: number;
    page: number;
}

export interface SteamMachineStatusChangeResponse extends CoreApiResponse {
    id: string,
    type: string,
    attributes: MachineAttributes
}

export interface MachineAssignResponse extends CoreApiResponse {
    connection_link: string,
    machine: Machine,
}

export interface UserCreateApiResponse extends CoreApiResponse {
    type: string;
    attributes: {
        email: string;
    },
}

export interface MachineStatsQuery {
    start_at?: string;
    end_at?: string;
    application_id?: string;
    stream_id?: string;
}

export interface MachineStatsResponse extends CoreApiResponse {
    machines: Array<Machine>;
    count: number;
    page: number;
}

export interface MachineGetResponse extends CoreApiResponse {
    machine: Machine;
}

export enum KeyMappingSelection {
    click = 'click',
    game_mode = 'game_mode',
}

export interface ApplicationConfigurationSet {
    application_name: string;
    key_mapping_selection: KeyMappingSelection;
    changeable_key_mapping: boolean;
    machine_type_id: number;
}

export class ConfigurationError extends Error { }

export class HTTP_Error extends Error {
    status: number;
    body: string;
    constructor(status: number, body: string) {
        super(`HTTP Error ${status}`);
        this.status = status;
        this.body = body;
    }
}
