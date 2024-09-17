import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { useTranslation, initReactI18next } from 'react-i18next';
import { resetQuestionnaireAction, SaveAction } from '../store/treeStore/treeActions';
import { mapToTreeState } from '../helpers/FhirToTreeStateMapper';
import { TreeState, ActionType } from '../store/treeStore/treeStore';

interface UseBalossiEditProps {
  dispatch: Dispatch<any>;
  setIsFormBuilderShown: Dispatch<SetStateAction<boolean>>;
  setJsonData: Dispatch<SetStateAction<any>>;
}

export const useBalossiEdit = ({
  dispatch,
  setIsFormBuilderShown,
  setJsonData
}: UseBalossiEditProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const location = document.location;
    const urlParams = new URLSearchParams(location.search);
    const sessionKey = urlParams.get('sessionKey');
    const uuid = urlParams.get('uuid');
    const locale = urlParams.get('locale');

    if (sessionKey && locale) {
      fetch(`${location.origin}/gbom/system/messages/loadMessages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionKey}`
        },
        body: JSON.stringify({
          context : 'fhirQuestionnaireEditor',
          locale : locale
        }),
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error on questionnaire loading:\n${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }
          var resources: {[key: string]: any} = {};
          resources[locale] = {translation: data};
          i18n.use(initReactI18next).init({
            resources,
            lng: 'en-US',
            nsSeparator: false,
            keySeparator: false,
            interpolation: {
              escapeValue: false
            }
          });
          i18n.changeLanguage(locale);            
        }
      })
      .catch((error) => {
        console.log( error);
      });
    }

    if ( sessionKey && uuid) {
      fetch(`${location.origin}/gbom/common/questionnaire/loadJson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionKey}`, 
        },
        body: JSON.stringify( {
          uuid: uuid 
        })
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Error on questionnaire loading:\n${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => {
          setJsonData(data);
          if (data) {
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }
            const importedState = mapToTreeState(data);
            dispatch(resetQuestionnaireAction(importedState));
            setIsLoading(false);
            setIsFormBuilderShown(true);
          }
        })
        .catch((error) => {
          setError(error.message);
          setIsLoading(false);
        });
    } else {
      setError('Server offline');
    }
  }, [dispatch, setJsonData, setIsFormBuilderShown, i18n]);

  return { isLoading, error };
};

export function saveQuestionnaire(
  state: TreeState, 
  dispatch: { (value: ActionType): void; (arg0: any): void; }, 
  generateQuestionnaire: { (state: TreeState): string; (arg0: any): any; }, 
  saveAction: { (): SaveAction; (): any; }) {
  
  const questionnaire = generateQuestionnaire(state);
  const location = document.location;
  const urlParams = new URLSearchParams(location.search);
  const sessionKey = urlParams.get('sessionKey');
  const uuid = urlParams.get('uuid');
  const json = JSON.stringify(questionnaire);

  if (sessionKey && uuid) {
    fetch(`${location.origin}/gbom/common/questionnaire/saveJson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionKey}`
      },
      body: JSON.stringify({
        uuid : uuid,
        json : json,
      }),
    })
      .then(response => {
          if (!response.ok) {
            throw new Error(
              `${response}`
            );
          }
          return response.text();
      })
      .then(data => {
          window.close();
      })
      .catch(error => {
          console.error("Failed to save questionnaire:", error);
      });
      dispatch(saveAction());            
  } else {
      console.error("No server URL or UUID provided");
  }
}