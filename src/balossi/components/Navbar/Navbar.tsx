import { useContext, useRef, useState } from 'react';
import { generateQuestionnaire } from '../../../helpers/generateQuestionnaire';
import { Languages, TreeContext } from '../../../store/treeStore/treeStore';
import Btn from '../../../components/Btn/Btn';
import useOutsideClick from '../../../hooks/useOutsideClick';
import '../../../components/Navbar/Navbar.css';
import JSONView from '../../../components/JSONView/JSONView';
import PredefinedValueSetModal from '../../../components/PredefinedValueSetModal/PredefinedValueSetModal';
import ImportValueSet from '../../../components/ImportValueSet/ImportValueSet';
import { saveAction } from '../../../store/treeStore/treeActions';
import { validateOrphanedElements, validateTranslations, ValidationErrors } from '../../../helpers/orphanValidation';
import { ValidationErrorsModal } from '../../../components/ValidationErrorsModal/validationErrorsModal';
import { useTranslation } from 'react-i18next';
import IconBtn from '../../../components/IconBtn/IconBtn';
import MoreIcon from '../../../images/icons/ellipsis-horizontal-outline.svg';
import { saveQuestionnaire } from '../../library';

type Props = {
    showFormFiller: () => void;
    setValidationErrors: (errors: ValidationErrors[]) => void;
    validationErrors: ValidationErrors[];
    translationErrors: ValidationErrors[];
    setTranslationErrors: (errors: ValidationErrors[]) => void;
    toggleFormDetails: () => void;
    close: () => void;
    title: String | undefined;
};

enum MenuItem {
    none = 'none',
    file = 'file',
    more = 'more',
}

const Navbar = ({
    setValidationErrors,
    validationErrors,
    translationErrors,
    setTranslationErrors,
    toggleFormDetails,
    close,
    title
}: Props): JSX.Element => {
    const { t } = useTranslation();
    const { state, dispatch } = useContext(TreeContext);
    const [selectedMenuItem, setSelectedMenuItem] = useState(MenuItem.none);
    const [showContained, setShowContained] = useState(false);
    const [showImportValueSet, setShowImportValueSet] = useState(false);
    const [showJSONView, setShowJSONView] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);
    const navBarRef = useRef<HTMLDivElement>(null);

    const hideMenu = () => {
        setSelectedMenuItem(MenuItem.none);
    };

    useOutsideClick(navBarRef, hideMenu, selectedMenuItem === MenuItem.none);

    const callbackAndHide = (callback: () => void) => {
        callback();
        hideMenu();
    };

    const getFileName = (): string => {
        let technicalName = state.qMetadata.name || 'survey';
        technicalName = technicalName.length > 40 ? technicalName.substring(0, 40) + '...' : technicalName;
        const version = state.qMetadata.version ? `-v${state.qMetadata.version}` : '';
        if (state.qAdditionalLanguages && Object.values(state.qAdditionalLanguages).length < 1) {
            return `${technicalName}-${state.qMetadata.language}${version}`;
        }
        return `${technicalName}${version}`;
    };

    const handleMenuItemClick = (clickedItem: MenuItem) => {
        if (selectedMenuItem !== clickedItem) {
            setSelectedMenuItem(clickedItem);
        } else {
            hideMenu();
        }
    };

    const cachedProfile = sessionStorage.getItem('profile');
    const profile = cachedProfile ? JSON.parse(cachedProfile) : null;

    function getProfileName(): string {
        return `${profile.given_name} ${profile.family_name}`;
    }

    const hasTranslations = (languages: Languages | undefined): boolean => {
        return !!languages && Object.keys(languages).length > 0;
    };

    return (
        <>
            <header ref={navBarRef}>
                <div className="pull-left form-title">
                    <h1><IconBtn type="x" title={t('Close')} onClick={() => {close()}} /><a className="survey-title-button" onClick={toggleFormDetails}>{title || 'Phoenix Survey Builder'}</a></h1>
                </div>

                <div className="pull-right">
                    {profile && profile.name && (
                        <p
                            className="truncate profile-name"
                            title={t('You are logged in as {0}').replace('{0}', profile.name)}
                        >
                            {getProfileName()}
                        </p>
                    )}
                    <Btn title={t('Edit Metadata')} onClick={() => toggleFormDetails()} />
                    <Btn title={t('Preview')} onClick={() => {
                        setValidationErrors(
                            validateOrphanedElements(t, state.qOrder, state.qItems, state.qContained || []),
                        );
                        setShowJSONView(!showJSONView);
                    }} />
                    <Btn title={t('Save')} onClick={() =>  saveQuestionnaire(state, dispatch, generateQuestionnaire, saveAction)} />
                    <div
                        className="more-menu"
                        tabIndex={0}
                        role="button"
                        aria-label="menu list"
                        aria-pressed="false"
                        onClick={() => handleMenuItemClick(MenuItem.more)}
                        onKeyPress={(e) => e.code === 'Enter' && handleMenuItemClick(MenuItem.more)}
                    >
                        <img className="more-menu-icon" src={MoreIcon} alt="more icon" height={25} />
                    </div>
                    
                </div>
                {selectedMenuItem === MenuItem.more && (
                    <div className="menu">
                        <Btn
                            title={t('Validate')}
                            onClick={() => {
                                setValidationErrors(
                                    validateOrphanedElements(t, state.qOrder, state.qItems, state.qContained || []),
                                );
                                setTranslationErrors(
                                    validateTranslations(t, state.qOrder, state.qItems, state.qAdditionalLanguages),
                                );
                                setShowValidationErrors(true);
                            }}
                        />
                        <Btn
                            title={t('Import ValueSets')}
                            onClick={() => callbackAndHide(() => setShowImportValueSet(!showImportValueSet))}
                        />
                        <Btn
                            title={t('Predefined ValueSets')}
                            onClick={() => callbackAndHide(() => setShowContained(!showContained))}
                        />
                    </div>
                )}
            </header>
            {showValidationErrors && (
                <ValidationErrorsModal
                    validationErrors={validationErrors}
                    translationErrors={translationErrors}
                    hasTranslations={hasTranslations(state.qAdditionalLanguages)}
                    onClose={() => setShowValidationErrors(false)}
                />
            )}
            {showContained && <PredefinedValueSetModal close={() => setShowContained(!showContained)} />}
            {showImportValueSet && <ImportValueSet close={() => setShowImportValueSet(!showImportValueSet)} />}
            {showJSONView && <JSONView showJSONView={() => setShowJSONView(!showJSONView)} validationErrors={validationErrors} />}
        </>
    );
};

export default Navbar;
