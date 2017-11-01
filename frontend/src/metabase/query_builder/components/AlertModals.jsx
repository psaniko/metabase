import React, { Component } from "react";
import Button from "metabase/components/Button";
import SchedulePicker from "metabase/components/SchedulePicker";
import { connect } from "react-redux";
import { createAlert, deleteAlert, updateAlert } from "metabase/alert/alert";
import ModalContent from "metabase/components/ModalContent";
import { getUser, getUserIsAdmin } from "metabase/selectors/user";
import { getQuestion } from "metabase/query_builder/selectors";
import _ from "underscore";
import PulseEditChannels from "metabase/pulse/components/PulseEditChannels";
import { fetchPulseFormInput, fetchUsers } from "metabase/pulse/actions";
import { formInputSelector, userListSelector } from "metabase/pulse/selectors";
import DeleteModalWithConfirm from "metabase/components/DeleteModalWithConfirm";
import ModalWithTrigger from "metabase/components/ModalWithTrigger";
import { inflect } from "metabase/lib/formatting";
import { ALERT_TYPE_PROGRESS_BAR_GOAL, ALERT_TYPE_ROWS, ALERT_TYPE_TIMESERIES_GOAL } from "metabase-lib/lib/Alert";
import type { AlertType } from "metabase-lib/lib/Alert";
import Radio from "metabase/components/Radio";
import RetinaImage from "react-retina-image";
import Icon from "metabase/components/Icon";
import MetabaseCookies from "metabase/lib/cookies";
import cxs from 'cxs';

const getScheduleFromChannel = (channel) =>
    _.pick(channel, "schedule_day", "schedule_frame", "schedule_hour", "schedule_type")
const classes = cxs ({
    width: '185px',
})

@connect((state) => ({ question: getQuestion(state), user: getUser(state) }), { createAlert })
export class CreateAlertModalContent extends Component {
    // contains the first-time educational screen
    // ModalContent, parent uses ModalWithTrigger
    props: {
        onClose: boolean
    }

    constructor(props) {
        super()

        const { question, user } = props

        const alertType = question.alertType
        const typeDependentAlertFields = alertType === ALERT_TYPE_ROWS
            ? { alert_condition: "rows", alert_first_only: false }
            : { alert_condition: "goal", alert_first_only: true, alert_above_goal: true }

        const defaultEmailChannel = {
            enabled: true,
            channel_type: "email",
            recipients: [user],
            schedule_day: "mon",
            schedule_frame: null,
            schedule_hour: 0,
            schedule_type: "daily"
        }

        this.state = {
            hasSeenEducationalScreen: MetabaseCookies.getHasSeenAlertSplash(),
            // the default configuration for a new alert
            alert: {
                name: "We should probably autogenerate the alert name",
                alert_description: "The description should be autogenerated too",
                card: { id: question.id() },
                channels: [defaultEmailChannel],
                ...typeDependentAlertFields
            },
        }
    }

    onAlertChange = (alert) => this.setState({ alert })

    onCreateAlert = async () => {
        const { createAlert, onClose } = this.props
        const { alert } = this.state
        await createAlert(alert)
        // should close be triggered manually like this
        // but the creation notification would appear automatically ...?
        // OR should the modal visibility be part of QB redux state
        // (maybe check how other modals are implemented)
        onClose()
    }

    proceedFromEducationalScreen = () => {
        MetabaseCookies.setHasSeenAlertSplash(true)
        this.setState({ hasSeenEducationalScreen: true })
    }

    render() {
        const { question, onClose } = this.props
        const { alert, hasSeenEducationalScreen } = this.state

        if (!hasSeenEducationalScreen) {
            return (
                <ModalContent onClose={onClose}>
                    <AlertEducationalScreen onProceed={this.proceedFromEducationalScreen} />
                </ModalContent>
            )
        }

        // TODO: Remove PulseEdit css hack
        return (
            <ModalContent
                onClose={onClose}
            >
                <div className="PulseEdit ml-auto mr-auto mb4" style={{maxWidth: "550px"}}>
                    <AlertModalTitle text={t`Let's set up your alert`} />
                    <AlertEditForm
                        alertType={question.alertType()}
                        alert={alert}
                        onAlertChange={this.onAlertChange}
                        onDone={this.onCreateAlert}
                    />
                    <div className="flex">
                        <div className="ml-auto">
                            <Button onClick={onClose}>{t`Cancel`}</Button>
                            <Button primary className="mt4 ml2" onClick={this.onCreateAlert}>{t`Done`}</Button>
                        </div>
                    </div>
                </div>
            </ModalContent>
        )
    }
}

export class AlertEducationalScreen extends Component {
    props: {
        onProceed: () => void
    }

    render() {
        const { onProceed } = this.props;

        return (
            <div className="pt2 pb4 ml-auto mr-auto text-centered">
                <div className="pt4">
                    <h1 className="mb1 text-dark">{t`The wide world of alerts`}</h1>
                    <h3 className="mb4">{t`There are a few different kinds of alerts you can get`}</h3>
                </div>
                <div className="text-paragraph pt4">
                    <div className="flex align-center pr4">
                        <RetinaImage src="app/assets/img/alerts/education-illustration-01-raw-data.png" />
                        <p className={`${classes} ml3 text-left`}>{jt`When a raw data question ${<strong>returns any results</strong>}`}</p>
                    </div>
                    <div className="flex align-center flex-reverse pl4">
                        <RetinaImage src="app/assets/img/alerts/education-illustration-02-goal.png" />
                        <p className={`${classes} mr3 text-right`}>{jt`When a line or bar ${<strong>crosses a goal line</strong>}`}</p>
                    </div>
                    <div className="flex align-center">
                        <RetinaImage src="app/assets/img/alerts/education-illustration-03-progress.png" />
                        <p className={`${classes} ml3 text-left`}>{jt`When a progress bar ${<strong>reaches its goal</strong>}`}</p>
                    </div>
                </div>
                <Button primary className="mt4" onClick={onProceed}>{t`Set up an alert`}</Button>
            </div>
        )
    }
}

@connect((state) => ({ isAdmin: getUserIsAdmin(state), question: getQuestion(state) }), { updateAlert, deleteAlert })
export class UpdateAlertModalContent extends Component {
    props: {
        alert: any,
        onClose: boolean,
        updateAlert: (any) => void,
        deleteAlert: (any) => void,
        isAdmin: boolean
    }

    constructor(props) {
        super()
        this.state = {
            modifiedAlert: props.alert
        }
    }

    onAlertChange = (modifiedAlert) => this.setState({ modifiedAlert })

    onUpdateAlert = async () => {
        const { updateAlert, onClose } = this.props
        const { modifiedAlert } = this.state
        await updateAlert(modifiedAlert)
        onClose()
    }

    onDeleteAlert = async () => {
        const { alert, deleteAlert, onClose } = this.props
        await deleteAlert(alert.id)
        onClose()
    }

    render() {
        const { onClose, question, alert, isAdmin } = this.props
        const { modifiedAlert } = this.state

        // TODO: Remove PulseEdit css hack
        return (
            <ModalContent
                onClose={onClose}
            >
                <div className="PulseEdit ml-auto mr-auto mb4" style={{maxWidth: "550px"}}>
                    <AlertModalTitle text={t`Edit your alert`} />
                    <AlertEditForm
                        alertType={question.alertType()}
                        alert={modifiedAlert}
                        onAlertChange={this.onAlertChange}
                        onDone={this.onUpdateAlert}
                    />
                    { isAdmin && <DeleteAlertSection alert={alert} onDeleteAlert={this.onDeleteAlert} /> }

                    <div className="flex">
                        <div className="ml-auto">
                            <Button onClick={onClose}>{t`Cancel`}</Button>
                            <Button primary className="mt4 ml2" onClick={this.onUpdateAlert}>{t`Save changes`}</Button>
                        </div>
                    </div>
                </div>
            </ModalContent>
        )
    }
}

export class DeleteAlertSection extends Component {
    deleteModal: any

    getConfirmItems() {
        // same as in PulseEdit but with some changes to copy
        return this.props.alert.channels.map(c =>
            c.channel_type === "email" ?
                <span>{jt`This alert will no longer be emailed to ${<strong>{c.recipients.length} {inflect("address", c.recipients.length)}</strong>}.`}</span>
                : c.channel_type === "slack" ?
                <span>{jt`Slack channel ${<strong>{c.details && c.details.channel}</strong>} will no longer get this alert.`}</span>
                :
                <span>{jt`Channel ${<strong>{c.channel_type}</strong>} will no longer receive this alert.`}</span>
        );
    }

    render() {
        const { onDeleteAlert } = this.props

        return (
            <div className="DangerZone mt4 pt4 mb2 p3 rounded bordered relative">
                <h3 className="text-error absolute top bg-white px1" style={{ marginTop: "-12px" }}>{jt`Danger Zone`}</h3>
                <div className="ml1">
                    <h4 className="text-bold mb1">{jt`Delete this alert`}</h4>
                    <div className="flex">
                        <p className="h4 pr2">{jt`Stop delivery and delete this alert. There's no undo, so be careful.`}</p>
                        <ModalWithTrigger
                            ref={(ref) => this.deleteModal = ref}
                            triggerClasses="Button Button--danger flex-align-right flex-no-shrink"
                            triggerElement="Delete this Alert"
                        >
                            <DeleteModalWithConfirm
                                objectType="alert"
                                title={t`Delete this alert?`}
                                confirmItems={this.getConfirmItems()}
                                onClose={() => this.deleteModal.close()}
                                onDelete={onDeleteAlert}
                            />
                        </ModalWithTrigger>
                    </div>
                </div>
            </div>
        )
    }
}

const AlertModalTitle = ({ text }) =>
    <div className="ml-auto mr-auto my4 pb2 text-centered">
        <RetinaImage className="mb3" src="app/assets/img/alerts/alert-bell-confetti-illustration.png" />
        <h1 className="text-dark">{ text }</h1>
    </div>

@connect((state) => ({ isAdmin: getUserIsAdmin(state) }), null)
export class AlertEditForm extends Component {
    props: {
        alertType: AlertType,
        alert: any,
        onAlertChange: (any) => void,
        isAdmin: boolean
    }

    onScheduleChange = (schedule) => {
        const { alert, onAlertChange } = this.props;

        // update the same schedule to all channels at once
        onAlertChange({
            ...alert,
            channels: alert.channels.map((channel) => ({ ...channel, ...schedule }))
        })
    }

    render() {
        const { alertType, alert, isAdmin, onAlertChange } = this.props

        // the schedule should be same for all channels so we can use the first one
        const schedule = getScheduleFromChannel(alert.channels[0])

        return (
            <div>
                <AlertGoalToggles
                    alertType={alertType}
                    alert={alert}
                    onAlertChange={onAlertChange}
                />
                <AlertEditSchedule
                    alertType={alertType}
                    schedule={schedule}
                    onScheduleChange={this.onScheduleChange}
                />
                { isAdmin &&
                    <AlertEditChannels
                        alert={alert}
                        onAlertChange={onAlertChange}
                    />
                }
            </div>
        )
    }
}

export const AlertGoalToggles = ({ alertType, alert, onAlertChange }) => {
    const isTimeseries = alertType === ALERT_TYPE_TIMESERIES_GOAL
    const isProgress = alertType === ALERT_TYPE_PROGRESS_BAR_GOAL

    if (!isTimeseries && !isProgress) {
        // not a goal alert
        return null
    }

    return (
        <div>
            <AlertAboveGoalToggle
                alert={alert}
                onAlertChange={onAlertChange}
                title={isTimeseries ? t`Alert me when the line…` : t`Alert me when the progress bar…`}
                trueText={isTimeseries ? t`Goes above the goal line` : t`Reaches the goal`}
                falseText={isTimeseries ? t`Goes below the goal line` : t`Goes below the goal`}
            />
            <AlertFirstOnlyToggle
                alert={alert}
                onAlertChange={onAlertChange}
                title={isTimeseries
                    ? t`The first time it crosses, or every time?`
                    : t`The first time it reaches the goal, or every time?`
                }
                trueText={t`The first time`}
                falseText={t`Every time` }
            />
        </div>
    )
}

export const AlertAboveGoalToggle = (props) =>
    <AlertSettingToggle {...props} setting="alert_above_goal" />

export const AlertFirstOnlyToggle = (props) =>
    <AlertSettingToggle {...props} setting="alert_first_only" />

export const AlertSettingToggle = ({ alert, onAlertChange, title, trueText, falseText, setting }) =>
    <div className="mb4 pb2">
        <h3 className="text-dark mb1">{title}</h3>
        <Radio
            value={alert[setting]}
            onChange={(value) => onAlertChange({ ...alert, [setting]: value })}
            options={[{ name: trueText, value: true }, { name: falseText, value: false }]}
        />
    </div>


export class AlertEditSchedule extends Component {
    render() {
        const { alertType, schedule } = this.props;

        return (
            <div>
                <h3 className="mt4 mb3 text-dark">How often should we check for results?</h3>

                <div className="bordered rounded mb2">
                    { alertType === ALERT_TYPE_ROWS && <RawDataAlertTip /> }
                    <div className="p3 bg-grey-0">
                        <SchedulePicker
                            schedule={schedule}
                            scheduleOptions={["hourly", "daily", "weekly"]}
                            onScheduleChange={this.props.onScheduleChange}
                            textBeforeInterval="Check"
                        />
                    </div>
                </div>
            </div>
        )
    }
}

@connect(
    (state) => ({ user: getUser(state), userList: userListSelector(state), formInput: formInputSelector(state) }),
    { fetchPulseFormInput, fetchUsers }
)
export class AlertEditChannels extends Component {
    props: {
        onChannelsChange: (any) => void,
        user: any,
        userList: any[],
        // this stupidly named property contains different channel options, nothing else
        formInput: any,
        fetchPulseFormInput: () => void,
        fetchUsers: () => void
    }

    componentDidMount() {
        this.props.fetchPulseFormInput();
        this.props.fetchUsers();
    }

    // Technically pulse definition is equal to alert definition
    onSetPulse = (alert) => {
        // If the pulse channel has been added, it PulseEditChannels puts the default schedule to it
        // We want to have same schedule for all channels
        const schedule = getScheduleFromChannel(alert.channels.find((c) => c.channel_type === "email"))

        this.props.onAlertChange({
            ...alert,
            channels: alert.channels.map((channel) => ({ ...channel, ...schedule }))
        })
    }

    render() {
        const { alert, user, userList, formInput } = this.props;
        return (
            <div className="mt4 pt2">
                <h3 className="text-dark mb3">{jt`Where do you want to send these alerts?`}</h3>
                <div className="mb2">
                    <PulseEditChannels
                        pulse={alert}
                        pulseId={alert.id}
                        pulseIsValid={true}
                        formInput={formInput}
                        user={user}
                        userList={userList}
                        setPulse={this.onSetPulse}
                        hideSchedulePicker={true}
                        emailRecipientText={t`Email alerts to:`}
                     />
                </div>
            </div>
        )
    }
}

// TODO: Not sure how to translate text with formatting properly
export const RawDataAlertTip = () =>
    <div className="border-row-divider p3 flex align-center">
        <div className="circle flex align-center justify-center bg-grey-0 p2 mr2 text-grey-3">
            <Icon name="lightbulb" size="20" />
        </div>
        <div>
            {jt`${<strong>Tip:</strong>} This kind of alert is most useful when your saved question doesn’t ${<em>usually</em>} return any results, but you want to know when it does.`}
        </div>
    </div>
